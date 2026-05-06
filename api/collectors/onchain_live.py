"""Live on-chain DePIN collector for any Solana wallet.

Sources:
  - Helium hotspots  -> Helius DAS (compressed NFTs) + H3 location decode
  - Token balances   -> Helius RPC getTokenAccountsByOwner (HNT/IOT/MOBILE/HONEY/RNDR)
  - Reward earnings  -> Helius enhanced tx (v0) filtered by token mint + time window

Every data point carries a ``source`` field:
  - "onchain"             -> verified on Solana
  - "onchain_unasserted"  -> hotspot NFT owned but location not asserted yet
  - "onchain_tx"          -> parsed from transaction history
  - "balance"             -> current wallet balance (not time-windowed earnings)
  - "region"              -> regional aggregate placeholder (Render)
  - "none"                -> no on-chain evidence (wallet empty for this protocol)
"""
from __future__ import annotations

import json
import time
from typing import Any, Iterable

import h3

from . import helius_client as helius

# SPL mints on Solana mainnet
MINT_HNT = "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux"
MINT_IOT = "iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns"
MINT_MOBILE = "mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6"
MINT_HONEY = "4vMsoUT2BWatFweudnQM1xedRLfJgJ7hswhcpz4xgBTy"
MINT_RNDR = "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof"

PROTOCOL_MINTS = {
    "Helium": [MINT_HNT, MINT_IOT, MINT_MOBILE],
    "Hivemapper": [MINT_HONEY],
    "Render": [MINT_RNDR],
}

# Render operators are cloud-GPU; no public geo per wallet.
# We show earnings only, and for the map we fall back to generic regional pools
# weighted by known Render Network provider density.
RENDER_REGION_POOLS = [
    {"region": "us-east", "lat": 38.9, "lng": -77.0},
    {"region": "us-west", "lat": 37.4, "lng": -122.1},
    {"region": "eu-west", "lat": 52.4, "lng": 4.9},
    {"region": "eu-central", "lat": 50.1, "lng": 8.7},
    {"region": "ap-south", "lat": 1.35, "lng": 103.8},
]

# Hivemapper driver GPS is private per-wallet. We only surface aggregate coverage
# (rendered as a background tile layer on the frontend), not point locations.


def _h3_to_latlng(cell: Any) -> tuple[float, float] | None:
    """Accept h3 cell as hex string, int, or '0x'-prefixed — return (lat, lng)."""
    if cell is None:
        return None
    try:
        if isinstance(cell, int):
            s = hex(cell)[2:]
        else:
            s = str(cell).strip().lower().removeprefix("0x")
        if not s:
            return None
        lat, lng = h3.cell_to_latlng(s)
        return float(lat), float(lng)
    except Exception:
        return None


def _extract_attrs(asset: dict) -> dict[str, Any]:
    attrs = (
        asset.get("content", {})
        .get("metadata", {})
        .get("attributes", [])
        or []
    )
    out = {}
    for a in attrs:
        key = str(a.get("trait_type", "")).lower().replace(" ", "_")
        out[key] = a.get("value")
    return out


# Known Helium Foundation addresses — any cNFT with one of these as
# verified creator is almost certainly a hotspot NFT.
_HELIUM_CREATOR_HINTS = {
    "hntyvp6yfm1hg25tn9wglqm12b8tqmcknkrdu1oxwux",  # HNT mint (shows up as verified)
    "hemjupxbpnvggtaunn1mwt3wrdhttkefostcc2p9pg8",  # Helium Entity Manager
    "mobw5qpwhvxvxp6pvsbep5u9vymlk7ywrcpb3ncmrygp",  # Mobile update authority (common)
}


def _looks_like_helium_hotspot(asset: dict) -> str | None:
    """Return 'IoT', 'MOBILE' or None based on asset metadata + grouping.

    The filter is deliberately lenient — false positives are harmless (the UI
    just shows an 'unasserted' pin), while false negatives cost us real nodes.
    """
    meta = asset.get("content", {}).get("metadata", {})
    json_meta = asset.get("content", {}).get("json_uri", "") or ""
    symbol = (meta.get("symbol") or "").upper()
    name = (meta.get("name") or "").lower()
    desc = (meta.get("description") or "").lower()

    haystack = f"{name} {desc} {symbol.lower()} {json_meta.lower()}"

    # Grouping hints (collection metadata)
    for g in asset.get("grouping", []) or []:
        gv = str(g.get("group_value", "")).lower()
        gm = g.get("collection_metadata") or {}
        gname = str(gm.get("name", "")).lower()
        gsym = str(gm.get("symbol", "")).lower()
        blob = f"{gv} {gname} {gsym}"
        if "mobile" in blob:
            return "MOBILE"
        if "iot" in blob or "hotspot" in blob or "helium" in blob:
            return "IoT"

    # Symbol-based
    if symbol in {"HOTSPOT", "IOTHOT", "IOT", "HNT-IOT"}:
        return "IoT"
    if symbol in {"MOBILEHOT", "MHOT", "MOBILE", "HNT-MOBILE"}:
        return "MOBILE"

    # Creator hints
    creators = asset.get("creators") or []
    for c in creators:
        addr = str(c.get("address", "")).lower()
        if addr in _HELIUM_CREATOR_HINTS:
            return "MOBILE" if "mobile" in haystack else "IoT"

    # Free-text fallback — Helium hotspot names follow "adjective-color-animal"
    # pattern. We avoid requiring it (too fragile) and just look for keywords.
    if any(k in haystack for k in ("helium", "hotspot")):
        return "MOBILE" if "mobile" in haystack else "IoT"

    return None


def _summarise_hotspot(asset: dict, wallet: str, kind: str) -> dict:
    meta = asset.get("content", {}).get("metadata", {})
    attrs = _extract_attrs(asset)

    # Try every plausible attribute name. Helium has used several over time.
    location_hex = None
    for key in (
        "location",
        "asserted_hex",
        "hex",
        "h3",
        "h3_index",
        "h3index",
        "asserted_location",
        "location_hex",
        "cell",
    ):
        if attrs.get(key):
            location_hex = attrs[key]
            break
    # Also accept direct lat/lng attributes if present
    lat_attr = attrs.get("lat") or attrs.get("latitude")
    lng_attr = attrs.get("lng") or attrs.get("lon") or attrs.get("longitude")

    latlng = _h3_to_latlng(location_hex)
    if not latlng and lat_attr is not None and lng_attr is not None:
        try:
            latlng = (float(lat_attr), float(lng_attr))
        except (TypeError, ValueError):
            latlng = None

    return {
        "node_id": meta.get("name") or asset.get("id", "")[:12],
        "owner": wallet,
        "protocol": "Helium",
        "status": "Online" if latlng else "Unasserted",
        "lat": latlng[0] if latlng else None,
        "lng": latlng[1] if latlng else None,
        "uptime_24h": None,
        "earnings_24h": None,
        "earnings_30d": None,
        "metadata_json": json.dumps(
            {
                "asset_id": asset.get("id"),
                "kind": kind,
                "elevation": attrs.get("elevation"),
                "gain": attrs.get("gain"),
                "location_hex": location_hex,
            }
        ),
        "source": "onchain" if latlng else "onchain_unasserted",
    }


async def fetch_helium_hotspots_onchain(wallet: str) -> tuple[list[dict], int]:
    """Return all Helium hotspots owned by `wallet`, with real H3→latlng.

    Returns (hotspots, total_cnft_count) so the UI can tell the user
    "we saw N assets, matched X as Helium".
    """
    try:
        resp = await helius.das_assets_by_owner(wallet, page=1, limit=1000)
    except Exception as e:
        print(f"[onchain] DAS failed for {wallet[:8]}…: {e}")
        return [], 0

    items = (resp or {}).get("items", []) or []
    hotspots = []
    for item in items:
        kind = _looks_like_helium_hotspot(item)
        if not kind:
            continue
        hotspots.append(_summarise_hotspot(item, wallet, kind))

    print(
        f"[onchain] {wallet[:8]}… DAS items={len(items)}, "
        f"matched_helium={len(hotspots)} "
        f"(with_location={sum(1 for h in hotspots if h['lat'] is not None)})"
    )
    return hotspots, len(items)


async def fetch_token_balances(wallet: str) -> dict[str, dict[str, float]]:
    """Return {protocol: {mint_name: ui_amount}} for the known DePIN tokens."""
    all_mints: list[str] = []
    for ms in PROTOCOL_MINTS.values():
        all_mints.extend(ms)
    balances = await helius.token_balances(wallet, all_mints)

    symbol_map = {
        MINT_HNT: "HNT",
        MINT_IOT: "IOT",
        MINT_MOBILE: "MOBILE",
        MINT_HONEY: "HONEY",
        MINT_RNDR: "RNDR",
    }
    out: dict[str, dict[str, float]] = {"Helium": {}, "Hivemapper": {}, "Render": {}}
    for proto, mints in PROTOCOL_MINTS.items():
        for m in mints:
            out[proto][symbol_map[m]] = float(balances.get(m, 0.0) or 0.0)
    return out


async def fetch_reward_flows(
    wallet: str, windows_days: Iterable[int] = (1, 30)
) -> dict[str, dict[int, float]]:
    """Parse recent transfers and sum inflows of HNT/HONEY/RNDR per time window.

    Returns {protocol: {days: ui_amount}}.
    """
    symbol_to_proto = {
        "HNT": "Helium",
        "IOT": "Helium",
        "MOBILE": "Helium",
        "HONEY": "Hivemapper",
        "RNDR": "Render",
    }
    mint_to_symbol = {
        MINT_HNT: "HNT",
        MINT_IOT: "IOT",
        MINT_MOBILE: "MOBILE",
        MINT_HONEY: "HONEY",
        MINT_RNDR: "RNDR",
    }

    out: dict[str, dict[int, float]] = {
        "Helium": {d: 0.0 for d in windows_days},
        "Hivemapper": {d: 0.0 for d in windows_days},
        "Render": {d: 0.0 for d in windows_days},
    }

    try:
        txs = await helius.enhanced_transactions(wallet, tx_type=None, limit=100)
    except Exception as e:
        print(f"[onchain] enhanced_transactions failed: {e}")
        return out

    now = int(time.time())
    for tx in txs or []:
        ts = int(tx.get("timestamp") or 0)
        if ts <= 0:
            continue
        age_days = (now - ts) / 86400.0
        for tt in tx.get("tokenTransfers", []) or []:
            if tt.get("toUserAccount") != wallet:
                continue
            mint = tt.get("mint")
            sym = mint_to_symbol.get(mint)
            if not sym:
                continue
            proto = symbol_to_proto[sym]
            amount = float(tt.get("tokenAmount") or 0.0)
            for d in windows_days:
                if age_days <= d:
                    out[proto][d] += amount
    return out


async def snapshot_wallet(wallet: str) -> dict:
    """Aggregate everything we can know on-chain for a wallet.

    Returns dict with:
      hotspots: list[Helium hotspots with real lat/lng where asserted]
      balances: per-protocol token balances
      rewards:  per-protocol inflow for 24h / 30d windows
      provenance: per-metric source tags
      summary:  flattened protocol-level view for quick UI consumption
    """
    hotspots, total_cnfts = await fetch_helium_hotspots_onchain(wallet)
    balances = await fetch_token_balances(wallet)
    rewards = await fetch_reward_flows(wallet, windows_days=(1, 30))

    # Per-protocol summary (what the UI needs)
    active_hotspots = [h for h in hotspots if h["status"] == "Online"]
    heli_bal_any = (
        balances["Helium"]["HNT"] > 0
        or balances["Helium"]["IOT"] > 0
        or balances["Helium"]["MOBILE"] > 0
    )
    has_any_helium = bool(hotspots) or heli_bal_any or rewards["Helium"][30] > 0
    has_any_hivemapper = balances["Hivemapper"]["HONEY"] > 0 or rewards["Hivemapper"][30] > 0
    has_any_render = balances["Render"]["RNDR"] > 0 or rewards["Render"][30] > 0

    summary = {
        "Helium": {
            "node_count": len(hotspots),
            "active_count": len(active_hotspots),
            "balances": balances["Helium"],
            "earnings_24h": rewards["Helium"][1],
            "earnings_30d": rewards["Helium"][30],
            "has_activity": has_any_helium,
            "source": {
                "nodes": "onchain" if hotspots else "none",
                "earnings": "onchain_tx" if rewards["Helium"][30] > 0 else (
                    "balance" if balances["Helium"]["HNT"] > 0 else "none"
                ),
            },
        },
        "Hivemapper": {
            "node_count": 0,
            "active_count": 0,
            "balances": balances["Hivemapper"],
            "earnings_24h": rewards["Hivemapper"][1],
            "earnings_30d": rewards["Hivemapper"][30],
            "has_activity": has_any_hivemapper,
            "source": {
                "nodes": "aggregate",  # driver GPS private
                "earnings": "onchain_tx" if rewards["Hivemapper"][30] > 0 else (
                    "balance" if balances["Hivemapper"]["HONEY"] > 0 else "none"
                ),
            },
        },
        "Render": {
            "node_count": 0,
            "active_count": 0,
            "balances": balances["Render"],
            "earnings_24h": rewards["Render"][1],
            "earnings_30d": rewards["Render"][30],
            "has_activity": has_any_render,
            "source": {
                "nodes": "region",  # no public GPU geo
                "earnings": "onchain_tx" if rewards["Render"][30] > 0 else (
                    "balance" if balances["Render"]["RNDR"] > 0 else "none"
                ),
            },
        },
    }

    # Synthetic region-level markers for Render so the map isn't empty
    # if wallet has real RNDR activity.
    render_region_nodes: list[dict] = []
    if has_any_render:
        for i, pool in enumerate(RENDER_REGION_POOLS):
            render_region_nodes.append(
                {
                    "node_id": f"render-{pool['region']}",
                    "owner": wallet,
                    "protocol": "Render",
                    "status": "Region",
                    "lat": pool["lat"],
                    "lng": pool["lng"],
                    "uptime_24h": None,
                    "earnings_24h": None,
                    "earnings_30d": None,
                    "metadata_json": json.dumps(
                        {"region": pool["region"], "aggregation": "datacenter_cluster"}
                    ),
                    "source": "region",
                }
            )

    return {
        "wallet": wallet,
        "hotspots": hotspots,
        "render_regions": render_region_nodes,
        "balances": balances,
        "rewards": rewards,
        "summary": summary,
        "has_any_activity": has_any_helium or has_any_hivemapper or has_any_render,
        "asset_count": total_cnfts,
    }
