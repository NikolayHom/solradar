import os
from dotenv import load_dotenv

load_dotenv()

RENDER_API_URL = "https://api.rendernetwork.com/v1"
RPC_URL = os.getenv("RPC_URL", "https://api.mainnet-beta.solana.com")


async def fetch_render_stats():
    """Fetch Render Network stats and GPU node data."""
    print(f"[render] fetching network stats")
    return {
        "protocol": "Render",
        "total_nodes": 0,
        "active_nodes": 0,
        "total_rewards_24h": 0,
        "nodes": [],
    }


async def fetch_node_earnings(node_address: str):
    """Fetch earnings for a specific Render node."""
    print(f"[render] earnings for {node_address[:8]}...")
    return {
        "address": node_address,
        "protocol": "Render",
        "earnings_24h": 0,
        "gpu_type": "unknown",
        "jobs_completed": 0,
    }


async def fetch_render_nodes(wallet: str):
    """Fetch all Render nodes for a wallet."""
    print(f"[render] nodes for {wallet[:8]}...")
    return []
