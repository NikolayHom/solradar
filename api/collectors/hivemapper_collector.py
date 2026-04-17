import json
import random

# Shared demo wallets
DEMO_WALLETS = [
    "7xKzR5qhN8mCvPjE2nG4aT9bW1fS6dL3Y0p",
    "Bq4vT8xL9wR2mF7nJ3kA5sY6dP0hC1gE8u",
    "Hn9fW2kT5vL8qR3mA7xJ1bC4sP0dY6gE9u",
]

# Dashcam cities with real coordinates — US-heavy + global corridors
HIVEMAPPER_LOCATIONS = [
    # US — dashcam heartland
    {"city": "San Francisco",  "lat": 37.7749, "lng": -122.4194},
    {"city": "Los Angeles",    "lat": 34.0522, "lng": -118.2437},
    {"city": "San Diego",      "lat": 32.7157, "lng": -117.1611},
    {"city": "Austin",         "lat": 30.2672, "lng":  -97.7431},
    {"city": "Miami",          "lat": 25.7617, "lng":  -80.1918},
    {"city": "New York",       "lat": 40.7128, "lng":  -74.0060},
    {"city": "Portland",       "lat": 45.5152, "lng": -122.6784},
    {"city": "Chicago",        "lat": 41.8781, "lng":  -87.6298},
    {"city": "Seattle",        "lat": 47.6062, "lng": -122.3321},
    {"city": "Boston",         "lat": 42.3601, "lng":  -71.0589},
    {"city": "Washington DC",  "lat": 38.9072, "lng":  -77.0369},
    {"city": "Denver",         "lat": 39.7392, "lng": -104.9903},
    {"city": "Dallas",         "lat": 32.7767, "lng":  -96.7970},
    {"city": "Houston",        "lat": 29.7604, "lng":  -95.3698},
    {"city": "Atlanta",        "lat": 33.7490, "lng":  -84.3880},
    {"city": "Phoenix",        "lat": 33.4484, "lng": -112.0740},
    {"city": "Nashville",      "lat": 36.1627, "lng":  -86.7816},
    {"city": "Orlando",        "lat": 28.5383, "lng":  -81.3792},
    {"city": "Philadelphia",   "lat": 39.9526, "lng":  -75.1652},
    {"city": "Salt Lake City", "lat": 40.7608, "lng": -111.8910},
    # Canada
    {"city": "Toronto",        "lat": 43.6532, "lng":  -79.3832},
    {"city": "Vancouver",      "lat": 49.2827, "lng": -123.1207},
    # LATAM
    {"city": "Mexico City",    "lat": 19.4326, "lng":  -99.1332},
    {"city": "São Paulo",      "lat":-23.5505, "lng":  -46.6333},
    {"city": "Buenos Aires",   "lat":-34.6037, "lng":  -58.3816},
    # EU corridor
    {"city": "London",         "lat": 51.5074, "lng":   -0.1278},
    {"city": "Paris",          "lat": 48.8566, "lng":    2.3522},
    {"city": "Berlin",         "lat": 52.5200, "lng":   13.4050},
    {"city": "Amsterdam",      "lat": 52.3676, "lng":    4.9041},
    {"city": "Madrid",         "lat": 40.4168, "lng":   -3.7038},
    {"city": "Milan",          "lat": 45.4642, "lng":    9.1900},
    {"city": "Warsaw",         "lat": 52.2297, "lng":   21.0122},
    # Asia / Gulf
    {"city": "Seoul",          "lat": 37.5665, "lng":  126.9780},
    {"city": "Tokyo",          "lat": 35.6762, "lng":  139.6503},
    {"city": "Dubai",          "lat": 25.2048, "lng":   55.2708},
    {"city": "Bangalore",      "lat": 12.9716, "lng":   77.5946},
    # Oceania
    {"city": "Sydney",         "lat":-33.8688, "lng":  151.2093},
    {"city": "Melbourne",      "lat":-37.8136, "lng":  144.9631},
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
    paused_indices = {3, 9, 14, 21, 27, 33, 36}

    total = len(HIVEMAPPER_LOCATIONS)
    for i in range(total):
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
