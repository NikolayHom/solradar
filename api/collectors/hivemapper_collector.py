import json
import random

# Shared demo wallets
DEMO_WALLETS = [
    "7xKzR5qhN8mCvPjE2nG4aT9bW1fS6dL3Y0p",
    "Bq4vT8xL9wR2mF7nJ3kA5sY6dP0hC1gE8u",
    "Hn9fW2kT5vL8qR3mA7xJ1bC4sP0dY6gE9u",
]

# Dashcam cities with real coordinates
HIVEMAPPER_LOCATIONS = [
    {"city": "San Francisco", "lat": 37.7749, "lng": -122.4194},
    {"city": "Los Angeles", "lat": 34.0522, "lng": -118.2437},
    {"city": "Austin", "lat": 30.2672, "lng": -97.7431},
    {"city": "Miami", "lat": 25.7617, "lng": -80.1918},
    {"city": "London", "lat": 51.5074, "lng": -0.1278},
    {"city": "Berlin", "lat": 52.5200, "lng": 13.4050},
    {"city": "Seoul", "lat": 37.5665, "lng": 126.9780},
    {"city": "Dubai", "lat": 25.2048, "lng": 55.2708},
    {"city": "Sao Paulo", "lat": -23.5505, "lng": -46.6333},
    {"city": "New York", "lat": 40.7128, "lng": -74.0060},
    {"city": "Portland", "lat": 45.5152, "lng": -122.6784},
    {"city": "Chicago", "lat": 41.8781, "lng": -87.6298},
]

CAMERA_MODELS = [
    "Hivemapper Dashcam",
    "Hivemapper Dashcam S",
    "BlackVue DR900X",
    "Nexar One Pro",
]


def _build_hivemapper_nodes() -> list[dict]:
    """Build realistic Hivemapper dashcam device entries."""
    random.seed(77)
    nodes = []
    paused_indices = {3, 9}

    for i in range(12):
        loc = HIVEMAPPER_LOCATIONS[i]
        is_paused = i in paused_indices
        wallet_idx = i % len(DEMO_WALLETS)

        hex_id = f"{0xA1B2C3 + i * 0x1F3D:06X}"
        lat_jitter = (i * 0.0029) % 0.04
        lng_jitter = (i * 0.0041) % 0.04

        if is_paused:
            uptime = 0.0
            earnings_24h = 0
        else:
            uptime = round(random.uniform(40.0, 95.0), 1)
            earnings_24h = random.randint(5000, 50000)

        earnings_30d = earnings_24h * random.randint(24, 30) if not is_paused else 0

        km_mapped_today = round(random.uniform(8.0, 65.0), 1) if not is_paused else 0.0
        quality = round(random.uniform(0.72, 0.98), 2) if not is_paused else 0.0

        metadata = {
            "km_mapped": km_mapped_today,
            "km_mapped_total": round(km_mapped_today * random.randint(80, 200), 1),
            "quality_score": quality,
            "camera_model": random.choice(CAMERA_MODELS),
            "city": loc["city"],
            "streak_days": random.randint(5, 120) if not is_paused else 0,
        }

        nodes.append({
            "node_id": f"HM-{hex_id}",
            "owner": DEMO_WALLETS[wallet_idx],
            "status": "Paused" if is_paused else "Active",
            "lat": round(loc["lat"] + lat_jitter, 4),
            "lng": round(loc["lng"] + lng_jitter, 4),
            "uptime_24h": uptime,
            "earnings_24h": earnings_24h,
            "earnings_30d": earnings_30d,
            "metadata_json": json.dumps(metadata),
        })

    return nodes


async def fetch_hivemapper_stats() -> dict:
    """Return Hivemapper network statistics with realistic demo data."""
    random.seed(77)
    nodes = _build_hivemapper_nodes()
    active_nodes = [n for n in nodes if n["status"] == "Active"]
    total_rewards = sum(n["earnings_24h"] for n in nodes)

    print(f"[hivemapper] generated {len(nodes)} demo dashcams ({len(active_nodes)} active)")
    return {
        "protocol": "Hivemapper",
        "total_nodes": len(nodes),
        "active_nodes": len(active_nodes),
        "total_rewards_24h": total_rewards,
        "nodes": nodes,
    }


async def fetch_mapper_earnings(mapper_address: str) -> dict:
    """Fetch earnings for a specific Hivemapper device."""
    nodes = _build_hivemapper_nodes()
    for n in nodes:
        if n["node_id"] == mapper_address:
            meta = json.loads(n["metadata_json"])
            return {
                "address": mapper_address,
                "protocol": "Hivemapper",
                "earnings_24h": n["earnings_24h"],
                "km_mapped": meta.get("km_mapped", 0),
                "quality_score": meta.get("quality_score", 0),
            }
    return {
        "address": mapper_address,
        "protocol": "Hivemapper",
        "earnings_24h": 0,
        "km_mapped": 0,
        "quality_score": 0,
    }


async def fetch_mapper_nodes(wallet: str) -> list[dict]:
    """Fetch all dashcam devices for a wallet address."""
    nodes = _build_hivemapper_nodes()
    return [n for n in nodes if n["owner"] == wallet]
