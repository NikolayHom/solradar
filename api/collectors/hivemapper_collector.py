import os
from dotenv import load_dotenv

load_dotenv()

HIVEMAPPER_API_URL = "https://api.hivemapper.com/v1"
RPC_URL = os.getenv("RPC_URL", "https://api.mainnet-beta.solana.com")


async def fetch_hivemapper_stats():
    """Fetch Hivemapper network stats and mapper data."""
    print(f"[hivemapper] fetching network stats")
    return {
        "protocol": "Hivemapper",
        "total_nodes": 0,
        "active_nodes": 0,
        "total_rewards_24h": 0,
        "nodes": [],
    }


async def fetch_mapper_earnings(mapper_address: str):
    """Fetch earnings for a specific Hivemapper contributor."""
    print(f"[hivemapper] earnings for {mapper_address[:8]}...")
    return {
        "address": mapper_address,
        "protocol": "Hivemapper",
        "earnings_24h": 0,
        "km_mapped": 0,
        "quality_score": 0,
    }


async def fetch_mapper_nodes(wallet: str):
    """Fetch all mapper devices for a wallet."""
    print(f"[hivemapper] nodes for {wallet[:8]}...")
    return []
