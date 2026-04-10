import os
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL", "https://api.devnet.solana.com")


async def fetch_helium_stats():
    """Fetch Helium network statistics."""
    print("[helium] fetching stats...")
    return {
        "protocol": "Helium",
        "total_nodes": 0,
        "active_nodes": 0,
        "total_rewards_24h": 0,
        "nodes": [],
    }


async def fetch_hotspot_earnings(hotspot_address: str):
    """Fetch earnings for a specific Helium hotspot."""
    print(f"[helium] earnings for {hotspot_address[:8]}...")
    return {
        "address": hotspot_address,
        "protocol": "Helium",
        "earnings_24h": 0,
        "earnings_30d": 0,
        "status": "Online",
    }


async def fetch_hotspot_nodes(wallet: str):
    """Fetch all hotspots for a wallet."""
    print(f"[helium] nodes for {wallet[:8]}...")
    return []
