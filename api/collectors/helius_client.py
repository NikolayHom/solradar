"""Thin async Helius RPC + DAS + enhanced-tx client."""

from __future__ import annotations

import os
from typing import Any
import httpx

_API_KEY = os.getenv("HELIUS_API_KEY", "").strip()
_BASE_RPC = f"https://mainnet.helius-rpc.com/?api-key={_API_KEY}" if _API_KEY else None
_BASE_ENH = f"https://api.helius.xyz/v0" if _API_KEY else None

_TIMEOUT = httpx.Timeout(15.0, connect=5.0)


def has_key() -> bool:
    return bool(_API_KEY)


async def _post(payload: dict) -> Any:
    if not _BASE_RPC:
        raise RuntimeError("HELIUS_API_KEY not configured")
    async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
        r = await c.post(_BASE_RPC, json=payload)
        r.raise_for_status()
        data = r.json()
    if "error" in data:
        raise RuntimeError(f"RPC {payload.get('method')} error: {data['error']}")
    return data.get("result")


async def rpc(method: str, params: list[Any]) -> Any:
    """Standard Solana JSON-RPC (positional params as array)."""
    return await _post({"jsonrpc": "2.0", "id": 1, "method": method, "params": params})


async def das(method: str, params: dict) -> Any:
    """Helius DAS (named params as object)."""
    return await _post({"jsonrpc": "2.0", "id": 1, "method": method, "params": params})


async def das_assets_by_owner(owner: str, page: int = 1, limit: int = 1000) -> dict:
    return await das(
        "getAssetsByOwner",
        {
            "ownerAddress": owner,
            "page": page,
            "limit": limit,
            "displayOptions": {
                "showCollectionMetadata": True,
                "showUnverifiedCollections": True,
            },
        },
    )


async def enhanced_transactions(
    address: str, tx_type: str | None = None, limit: int = 100
) -> list[dict]:
    """Helius enhanced /v0 parser — returns human-readable tx list."""
    if not _BASE_ENH:
        raise RuntimeError("HELIUS_API_KEY not configured")
    params = {"api-key": _API_KEY, "limit": limit}
    if tx_type:
        params["type"] = tx_type
    url = f"{_BASE_ENH}/addresses/{address}/transactions"
    async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
        r = await c.get(url, params=params)
        r.raise_for_status()
        return r.json()


async def token_balances(wallet: str, mints: list[str]) -> dict[str, float]:
    """Return {mint: ui_amount} for the requested mints owned by wallet."""
    out: dict[str, float] = {m: 0.0 for m in mints}
    for mint in mints:
        try:
            res = await rpc(
                "getTokenAccountsByOwner",
                [wallet, {"mint": mint}, {"encoding": "jsonParsed"}],
            )
            accounts = (res or {}).get("value", []) or []
            total = 0.0
            for acc in accounts:
                try:
                    info = (
                        acc.get("account", {})
                        .get("data", {})
                        .get("parsed", {})
                        .get("info", {})
                    )
                    amt = info.get("tokenAmount") or {}
                    ui = amt.get("uiAmount")
                    if ui is None:
                        # Fallback: parse raw amount with decimals
                        raw = amt.get("amount")
                        dec = amt.get("decimals")
                        if raw is not None and dec is not None:
                            ui = float(raw) / (10 ** int(dec))
                        else:
                            ui = 0.0
                    total += float(ui)
                except (TypeError, ValueError, AttributeError) as e:
                    print(f"[helius] skipped malformed token_account for {mint[:6]}…: {e}")
                    continue
            out[mint] = total
        except Exception as e:
            print(f"[helius] token_balances({mint[:6]}…) failed: {e}")
    return out
