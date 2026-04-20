import json
import random

# Shared demo wallets
DEMO_WALLETS = [
    "7xKzR5qhN8mCvPjE2nG4aT9bW1fS6dL3Y0p",
    "Bq4vT8xL9wR2mF7nJ3kA5sY6dP0hC1gE8u",
    "Xr3mK7vQ9wL2fT5nJ8bA1hC6sP4dY0gEu",
]

# Data-center cities — Tier-1 cloud/colo sites
RENDER_LOCATIONS = [
    # US
    {"city": "Ashburn, VA",    "lat": 39.0438, "lng":  -77.4874},
    {"city": "Portland, OR",   "lat": 45.5152, "lng": -122.6784},
    {"city": "Los Angeles",    "lat": 34.0522, "lng": -118.2437},
    {"city": "Dallas",         "lat": 32.7767, "lng":  -96.7970},
    {"city": "Chicago",        "lat": 41.8781, "lng":  -87.6298},
    {"city": "Atlanta",        "lat": 33.7490, "lng":  -84.3880},
    {"city": "New York",       "lat": 40.7128, "lng":  -74.0060},
    {"city": "San Jose",       "lat": 37.3382, "lng": -121.8863},
    {"city": "Phoenix",        "lat": 33.4484, "lng": -112.0740},
    # EU
    {"city": "Frankfurt",      "lat": 50.1109, "lng":    8.6821},
    {"city": "Amsterdam",      "lat": 52.3676, "lng":    4.9041},
    {"city": "London",         "lat": 51.5074, "lng":   -0.1278},
    {"city": "Paris",          "lat": 48.8566, "lng":    2.3522},
    {"city": "Dublin",         "lat": 53.3498, "lng":   -6.2603},
    {"city": "Stockholm",      "lat": 59.3293, "lng":   18.0686},
    {"city": "Warsaw",         "lat": 52.2297, "lng":   21.0122},
    # Asia / Pacific
    {"city": "Tokyo",          "lat": 35.6762, "lng":  139.6503},
    {"city": "Singapore",      "lat":  1.3521, "lng":  103.8198},
    {"city": "Seoul",          "lat": 37.5665, "lng":  126.9780},
    {"city": "Hong Kong",      "lat": 22.3193, "lng":  114.1694},
    {"city": "Mumbai",         "lat": 19.0760, "lng":   72.8777},
    {"city": "Sydney",         "lat":-33.8688, "lng":  151.2093},
    # Rest
    {"city": "Toronto",        "lat": 43.6532, "lng":  -79.3832},
    {"city": "São Paulo",      "lat":-23.5505, "lng":  -46.6333},
]

GPU_CONFIGS = [
    {"gpu_type": "RTX 4090", "vram_gb": 24, "benchmark_score": 9200},
    {"gpu_type": "RTX 4080", "vram_gb": 16, "benchmark_score": 7400},
    {"gpu_type": "A100 80GB", "vram_gb": 80, "benchmark_score": 12500},
    {"gpu_type": "A100 40GB", "vram_gb": 40, "benchmark_score": 11200},
    {"gpu_type": "RTX 3090", "vram_gb": 24, "benchmark_score": 6800},
    {"gpu_type": "H100", "vram_gb": 80, "benchmark_score": 15300},
    {"gpu_type": "RTX A6000", "vram_gb": 48, "benchmark_score": 8900},
]


def _build_render_nodes() -> list[dict]:
    """Build realistic Render Network GPU node entries."""
    random.seed(99)
    nodes = []
    maintenance_idx = {6, 13, 19}

    total = len(RENDER_LOCATIONS)
    for i in range(total):
        loc = RENDER_LOCATIONS[i]
        is_maintenance = i in maintenance_idx
        wallet_idx = i % len(DEMO_WALLETS)

        suffix = f"{chr(65 + i)}{random.randint(100, 999)}"
        lat_jitter = (i * 0.0019) % 0.03
        lng_jitter = (i * 0.0033) % 0.03

        gpu = GPU_CONFIGS[i % len(GPU_CONFIGS)]

        if is_maintenance:
            uptime = 0.0
            earnings_24h = 0
            jobs_completed = 0
        else:
            uptime = round(random.uniform(92.0, 99.9), 1)
            # GPU nodes earn more — values in RNDR smallest units
            earnings_24h = random.randint(100000, 500000)
            jobs_completed = random.randint(12, 85)

        earnings_30d = earnings_24h * random.randint(26, 30) if not is_maintenance else 0

        metadata = {
            "gpu_type": gpu["gpu_type"],
            "vram_gb": gpu["vram_gb"],
            "benchmark_score": gpu["benchmark_score"],
            "jobs_completed_24h": jobs_completed,
            "jobs_completed_total": jobs_completed * random.randint(60, 180),
            "city": loc["city"],
            "tier": "Pro" if gpu["vram_gb"] >= 40 else "Standard",
        }

        nodes.append({
            "node_id": f"RNDR-{suffix}",
            "owner": DEMO_WALLETS[wallet_idx],
            "status": "Maintenance" if is_maintenance else "Online",
            "lat": round(loc["lat"] + lat_jitter, 4),
            "lng": round(loc["lng"] + lng_jitter, 4),
            "uptime_24h": uptime,
            "earnings_24h": earnings_24h,
            "earnings_30d": earnings_30d,
            "metadata_json": json.dumps(metadata),
        })

    return nodes


async def fetch_render_stats() -> dict:
    """Return Render Network statistics with realistic demo data."""
    random.seed(99)
    nodes = _build_render_nodes()
    active_nodes = [n for n in nodes if n["status"] == "Online"]
    total_rewards = sum(n["earnings_24h"] for n in nodes)

    print(f"[render] generated {len(nodes)} demo GPU nodes ({len(active_nodes)} active)")
    return {
        "protocol": "Render",
        "total_nodes": len(nodes),
        "active_nodes": len(active_nodes),
        "total_rewards_24h": total_rewards,
        "nodes": nodes,
    }


async def fetch_node_earnings(node_address: str) -> dict:
    """Fetch earnings for a specific Render node."""
    nodes = _build_render_nodes()
    for n in nodes:
        if n["node_id"] == node_address:
            meta = json.loads(n["metadata_json"])
            return {
                "address": node_address,
                "protocol": "Render",
                "earnings_24h": n["earnings_24h"],
                "gpu_type": meta.get("gpu_type", "unknown"),
                "jobs_completed": meta.get("jobs_completed_24h", 0),
            }
    return {
        "address": node_address,
        "protocol": "Render",
        "earnings_24h": 0,
        "gpu_type": "unknown",
        "jobs_completed": 0,
    }


async def fetch_render_nodes(wallet: str) -> list[dict]:
    """Fetch all Render GPU nodes for a wallet address."""
    nodes = _build_render_nodes()
    return [n for n in nodes if n["owner"] == wallet]
