import json
import random

# Demo wallet addresses (shared across protocols for portfolio view)
DEMO_WALLETS = [
    "7xKzR5qhN8mCvPjE2nG4aT9bW1fS6dL3Y0p",
    "Bq4vT8xL9wR2mF7nJ3kA5sY6dP0hC1gE8u",
    "Hn9fW2kT5vL8qR3mA7xJ1bC4sP0dY6gE9u",
    "Xr3mK7vQ9wL2fT5nJ8bA1hC6sP4dY0gEu",
]

HOTSPOT_ADJECTIVES = [
    "brave", "cold", "warm", "happy", "sharp", "swift", "calm", "bold",
    "keen", "vast", "rare", "true", "wild", "pale", "deep", "high",
]
HOTSPOT_COLORS = [
    "jade", "neon", "ruby", "gold", "blue", "pink", "gray", "lime",
    "teal", "plum", "mint", "sand", "rust", "snow", "iris", "dusk",
]
HOTSPOT_ANIMALS = [
    "pelican", "tiger", "falcon", "mantis", "orca", "viper", "crane",
    "gecko", "raven", "panda", "bison", "cobra", "finch", "wolf",
    "fox", "elk", "lynx", "hawk", "bear",
]

# Real city coordinates for node placement — global spread
HELIUM_LOCATIONS = [
    # North America
    {"city": "New York",       "lat": 40.7128, "lng":  -73.9960},
    {"city": "Brooklyn",       "lat": 40.6782, "lng":  -73.9442},
    {"city": "Los Angeles",    "lat": 34.0522, "lng": -118.2437},
    {"city": "San Francisco",  "lat": 37.7749, "lng": -122.4194},
    {"city": "Chicago",        "lat": 41.8781, "lng":  -87.6298},
    {"city": "Miami",          "lat": 25.7617, "lng":  -80.1918},
    {"city": "Seattle",        "lat": 47.6062, "lng": -122.3321},
    {"city": "Denver",         "lat": 39.7392, "lng": -104.9903},
    {"city": "Austin",         "lat": 30.2672, "lng":  -97.7431},
    {"city": "Boston",         "lat": 42.3601, "lng":  -71.0589},
    {"city": "Washington DC",  "lat": 38.9072, "lng":  -77.0369},
    {"city": "Portland",       "lat": 45.5152, "lng": -122.6784},
    {"city": "Atlanta",        "lat": 33.7490, "lng":  -84.3880},
    {"city": "Phoenix",        "lat": 33.4484, "lng": -112.0740},
    {"city": "Houston",        "lat": 29.7604, "lng":  -95.3698},
    {"city": "Toronto",        "lat": 43.6532, "lng":  -79.3832},
    {"city": "Vancouver",      "lat": 49.2827, "lng": -123.1207},
    {"city": "Montreal",       "lat": 45.5017, "lng":  -73.5673},
    {"city": "Mexico City",    "lat": 19.4326, "lng":  -99.1332},
    # South America
    {"city": "Bogotá",         "lat":  4.7110, "lng":  -74.0721},
    {"city": "Lima",           "lat":-12.0464, "lng":  -77.0428},
    {"city": "Santiago",       "lat":-33.4489, "lng":  -70.6693},
    {"city": "Buenos Aires",   "lat":-34.6037, "lng":  -58.3816},
    {"city": "São Paulo",      "lat":-23.5505, "lng":  -46.6333},
    {"city": "Rio de Janeiro", "lat":-22.9068, "lng":  -43.1729},
    # Europe
    {"city": "London",         "lat": 51.5074, "lng":   -0.1278},
    {"city": "Paris",          "lat": 48.8566, "lng":    2.3522},
    {"city": "Berlin",         "lat": 52.5200, "lng":   13.4050},
    {"city": "Amsterdam",      "lat": 52.3676, "lng":    4.9041},
    {"city": "Barcelona",      "lat": 41.3851, "lng":    2.1734},
    {"city": "Madrid",         "lat": 40.4168, "lng":   -3.7038},
    {"city": "Rome",           "lat": 41.9028, "lng":   12.4964},
    {"city": "Milan",          "lat": 45.4642, "lng":    9.1900},
    {"city": "Vienna",         "lat": 48.2082, "lng":   16.3738},
    {"city": "Warsaw",         "lat": 52.2297, "lng":   21.0122},
    {"city": "Stockholm",      "lat": 59.3293, "lng":   18.0686},
    {"city": "Dublin",         "lat": 53.3498, "lng":   -6.2603},
    {"city": "Lisbon",         "lat": 38.7223, "lng":   -9.1393},
    {"city": "Zurich",         "lat": 47.3769, "lng":    8.5417},
    {"city": "Istanbul",       "lat": 41.0082, "lng":   28.9784},
    # Africa / Middle East
    {"city": "Cape Town",      "lat":-33.9249, "lng":   18.4241},
    {"city": "Johannesburg",   "lat":-26.2041, "lng":   28.0473},
    {"city": "Lagos",          "lat":  6.5244, "lng":    3.3792},
    {"city": "Nairobi",        "lat": -1.2921, "lng":   36.8219},
    {"city": "Cairo",          "lat": 30.0444, "lng":   31.2357},
    {"city": "Dubai",          "lat": 25.2048, "lng":   55.2708},
    {"city": "Tel Aviv",       "lat": 32.0853, "lng":   34.7818},
    # Asia / Pacific
    {"city": "Tokyo",          "lat": 35.6762, "lng":  139.6503},
    {"city": "Osaka",          "lat": 34.6937, "lng":  135.5023},
    {"city": "Seoul",          "lat": 37.5665, "lng":  126.9780},
    {"city": "Singapore",      "lat":  1.3521, "lng":  103.8198},
    {"city": "Bangkok",        "lat": 13.7563, "lng":  100.5018},
    {"city": "Jakarta",        "lat": -6.2088, "lng":  106.8456},
    {"city": "Manila",         "lat": 14.5995, "lng":  120.9842},
    {"city": "Mumbai",         "lat": 19.0760, "lng":   72.8777},
    {"city": "Delhi",          "lat": 28.6139, "lng":   77.2090},
    {"city": "Bangalore",      "lat": 12.9716, "lng":   77.5946},
    {"city": "Hong Kong",      "lat": 22.3193, "lng":  114.1694},
    {"city": "Taipei",         "lat": 25.0330, "lng":  121.5654},
    # Oceania
    {"city": "Sydney",         "lat":-33.8688, "lng":  151.2093},
    {"city": "Melbourne",      "lat":-37.8136, "lng":  144.9631},
    {"city": "Auckland",       "lat":-36.8485, "lng":  174.7633},
]


def _generate_hotspot_name(seed: int) -> str:
    """Generate a realistic Helium hotspot name."""
    random.seed(seed)
    adj = random.choice(HOTSPOT_ADJECTIVES)
    color = random.choice(HOTSPOT_COLORS)
    animal = random.choice(HOTSPOT_ANIMALS)
    return f"{adj}-{color}-{animal}"


def _build_helium_nodes() -> list[dict]:
    """Build a set of realistic Helium hotspot demo entries."""
    nodes = []
    # ~18% offline, deterministic picks across the list
    offline_indices = {4, 11, 15, 22, 28, 34, 41, 47, 53, 58}

    total = len(HELIUM_LOCATIONS)
    for i in range(total):
        loc = HELIUM_LOCATIONS[i]
        is_offline = i in offline_indices
        wallet_idx = i % len(DEMO_WALLETS)
        # Slight coordinate jitter so dots don't perfectly overlap
        lat_jitter = (i * 0.0037) % 0.05
        lng_jitter = (i * 0.0023) % 0.05

        if is_offline:
            uptime = 0.0
            earnings_24h = 0
        else:
            uptime = round(random.uniform(87.0, 99.8), 1)
            earnings_24h = random.randint(15000, 85000)

        earnings_30d = earnings_24h * random.randint(25, 30) if not is_offline else 0

        antenna_gains = [3.0, 4.0, 5.8, 6.0, 8.0, 9.0]
        elevations = [5, 10, 15, 20, 30, 45, 60]

        metadata = {
            "hotspot_type": random.choice(["Full", "Light", "Data-Only"]),
            "antenna_gain_dbi": random.choice(antenna_gains),
            "elevation_m": random.choice(elevations),
            "city": loc["city"],
            "firmware": f"2024.{random.randint(3, 9)}.{random.randint(10, 30)}",
        }

        nodes.append({
            "node_id": _generate_hotspot_name(1000 + i),
            "owner": DEMO_WALLETS[wallet_idx],
            "status": "Offline" if is_offline else "Online",
            "lat": round(loc["lat"] + lat_jitter, 4),
            "lng": round(loc["lng"] + lng_jitter, 4),
            "uptime_24h": uptime,
            "earnings_24h": earnings_24h,
            "earnings_30d": earnings_30d,
            "metadata_json": json.dumps(metadata),
        })

    return nodes


async def fetch_helium_stats() -> dict:
    """Return Helium network statistics with realistic demo data."""
    random.seed(42)
    nodes = _build_helium_nodes()
    active_nodes = [n for n in nodes if n["status"] == "Online"]
    total_rewards = sum(n["earnings_24h"] for n in nodes)

    print(f"[helium] generated {len(nodes)} demo hotspots ({len(active_nodes)} active)")
    return {
        "protocol": "Helium",
        "total_nodes": len(nodes),
        "active_nodes": len(active_nodes),
        "total_rewards_24h": total_rewards,
        "nodes": nodes,
    }


async def fetch_hotspot_earnings(hotspot_address: str) -> dict:
    """Fetch earnings for a specific Helium hotspot."""
    nodes = _build_helium_nodes()
    for n in nodes:
        if n["node_id"] == hotspot_address:
            return {
                "address": hotspot_address,
                "protocol": "Helium",
                "earnings_24h": n["earnings_24h"],
                "earnings_30d": n["earnings_30d"],
                "status": n["status"],
            }
    return {
        "address": hotspot_address,
        "protocol": "Helium",
        "earnings_24h": 0,
        "earnings_30d": 0,
        "status": "Unknown",
    }


async def fetch_hotspot_nodes(wallet: str) -> list[dict]:
    """Fetch all hotspots for a wallet address."""
    nodes = _build_helium_nodes()
    return [n for n in nodes if n["owner"] == wallet]
