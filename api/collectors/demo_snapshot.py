"""Synthetic snapshot for demo wallet so the scan flow is demonstrable.

Kept completely separate from the live on-chain path. Every field is tagged
``source: "demo"`` so the UI can show the DEMO badge honestly.
"""
from __future__ import annotations

import json
from typing import Any

DEMO_WALLETS = {
    "7xKzR5qhN8mCvPjE2nG4aT9bW1fS6dL3Y0p",
    # short forms sometimes typed
    "demo",
}


# Real coordinates for realistic map placement. These are not on-chain —
# the whole snapshot is demo data.
_DEMO_HOTSPOTS = [
    {"name": "brave-jade-pelican",  "city": "Brooklyn, NY",  "lat": 40.6782, "lng": -73.9442, "status": "Online",  "kind": "IoT",    "gain": 5.8, "elev": 20},
    {"name": "cold-neon-tiger",     "city": "Austin, TX",    "lat": 30.2672, "lng": -97.7431, "status": "Online",  "kind": "IoT",    "gain": 4.0, "elev": 15},
    {"name": "swift-ruby-falcon",   "city": "Berlin, DE",    "lat": 52.5200, "lng":  13.4050, "status": "Online",  "kind": "IoT",    "gain": 6.0, "elev": 30},
    {"name": "warm-gold-mantis",    "city": "Tokyo, JP",     "lat": 35.6762, "lng": 139.6503, "status": "Online",  "kind": "MOBILE", "gain": 8.0, "elev": 45},
    {"name": "bold-blue-orca",      "city": "Singapore",     "lat":  1.3521, "lng": 103.8198, "status": "Online",  "kind": "IoT",    "gain": 5.8, "elev": 25},
    {"name": "keen-teal-viper",     "city": "Sydney, AU",    "lat":-33.8688, "lng": 151.2093, "status": "Offline", "kind": "IoT",    "gain": 3.0, "elev": 10},
    {"name": "vast-plum-crane",     "city": "São Paulo, BR", "lat":-23.5505, "lng": -46.6333, "status": "Online",  "kind": "IoT",    "gain": 5.8, "elev": 18},
    {"name": "high-mint-gecko",     "city": "Amsterdam, NL", "lat": 52.3676, "lng":   4.9041, "status": "Online",  "kind": "MOBILE", "gain": 9.0, "elev": 40},
    {"name": "true-sand-raven",     "city": "Denver, CO",    "lat": 39.7392, "lng":-104.9903, "status": "Online",  "kind": "IoT",    "gain": 4.0, "elev": 22},
]

# Render "regions" rendered as aggregate pools (same as live path).
_DEMO_RENDER_POOLS = [
    {"region": "us-east",    "lat": 38.9, "lng": -77.0},
    {"region": "us-west",    "lat": 37.4, "lng": -122.1},
    {"region": "eu-west",    "lat": 52.4, "lng":  4.9},
    {"region": "eu-central", "lat": 50.1, "lng":  8.7},
    {"region": "ap-south",   "lat": 1.35, "lng": 103.8},
]


def is_demo(wallet: str) -> bool:
    return wallet.strip() in DEMO_WALLETS


def build_demo_snapshot(wallet: str) -> dict[str, Any]:
    hotspots = []
    for i, h in enumerate(_DEMO_HOTSPOTS):
        hotspots.append(
            {
                "node_id": h["name"],
                "owner": wallet,
                "protocol": "Helium",
                "status": h["status"],
                "lat": h["lat"],
                "lng": h["lng"],
                "uptime_24h": 98.4 if h["status"] == "Online" else 0.0,
                "earnings_24h": None,
                "earnings_30d": None,
                "metadata_json": json.dumps(
                    {
                        "asset_id": f"demo_asset_{i}",
                        "kind": h["kind"],
                        "elevation": h["elev"],
                        "gain": h["gain"],
                        "city": h["city"],
                    }
                ),
                "source": "demo",
            }
        )

    render_regions = [
        {
            "node_id": f"render-{p['region']}",
            "owner": wallet,
            "protocol": "Render",
            "status": "Region",
            "lat": p["lat"],
            "lng": p["lng"],
            "uptime_24h": None,
            "earnings_24h": None,
            "earnings_30d": None,
            "metadata_json": json.dumps({"region": p["region"], "aggregation": "demo_cluster"}),
            "source": "demo",
        }
        for p in _DEMO_RENDER_POOLS
    ]

    active_count = sum(1 for h in hotspots if h["status"] == "Online")

    protocols = [
        {
            "name": "Helium",
            "node_count": len(hotspots),
            "active_count": active_count,
            "balances": {"HNT": 42.318, "IOT": 12_480.5, "MOBILE": 2_340_125.0},
            "earnings_24h": 8.44,
            "earnings_30d": 241.7,
            "has_activity": True,
            "source": {"nodes": "demo", "earnings": "demo"},
        },
        {
            "name": "Hivemapper",
            "node_count": 0,
            "active_count": 0,
            "balances": {"HONEY": 18_240.0},
            "earnings_24h": 512.0,
            "earnings_30d": 14_310.0,
            "has_activity": True,
            "source": {"nodes": "aggregate", "earnings": "demo"},
        },
        {
            "name": "Render",
            "node_count": 0,
            "active_count": 0,
            "balances": {"RNDR": 95.4},
            "earnings_24h": 0.82,
            "earnings_30d": 24.1,
            "has_activity": True,
            "source": {"nodes": "demo", "earnings": "demo"},
        },
    ]

    return {
        "wallet": wallet,
        "mode": "demo",
        "has_any_activity": True,
        "nodes": hotspots + render_regions,
        "protocols": protocols,
        "rewards": {
            "Helium":     {1: 8.44,  30: 241.7},
            "Hivemapper": {1: 512.0, 30: 14310.0},
            "Render":     {1: 0.82,  30: 24.1},
        },
        "provenance": {
            "rpc": "demo-dataset",
            "helium_nodes": "demo_curated",
            "locations": "real_coordinates_demo_ownership",
            "earnings": "demo_synthesized",
            "render_locations": "region_aggregate_demo",
            "hivemapper_locations": "not_public_per_wallet",
            "notice": "all numbers are synthesized — scan a real wallet for live data",
        },
        "cached": False,
    }
