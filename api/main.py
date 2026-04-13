"""SolRadar API — DePIN analytics hub."""

import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import init_db, engine, get_session, async_session
from db.models import DePINNode, ProtocolMetrics
from collectors.helium_collector import fetch_helium_stats
from collectors.hivemapper_collector import fetch_hivemapper_stats
from collectors.render_collector import fetch_render_stats

# Protocol-level defaults for fallback and seed enrichment
PROTOCOL_DEFAULTS = {
    "Helium": {"token_price": 6.50, "network_coverage": 78.5},
    "Hivemapper": {"token_price": 0.032, "network_coverage": 12.3},
    "Render": {"token_price": 8.20, "network_coverage": 45.0},
}


async def _seed_database():
    """Auto-seed the database with demo data if tables are empty."""
    async with async_session() as db:
        row_count = await db.execute(
            select(func.count()).select_from(ProtocolMetrics)
        )
        existing = row_count.scalar() or 0

        if existing > 0:
            print(f"[seed] database already has {existing} protocol(s), skipping seed")
            return

        print("[seed] empty database detected — seeding demo data...")

        collectors = [
            fetch_helium_stats,
            fetch_hivemapper_stats,
            fetch_render_stats,
        ]

        total_seeded = 0

        for collector_fn in collectors:
            data = await collector_fn()
            protocol_name = data["protocol"]
            nodes = data.get("nodes", [])
            defaults = PROTOCOL_DEFAULTS.get(protocol_name, {})

            # Compute avg earnings per node
            active_count = data.get("active_nodes", 0)
            total_rewards = data.get("total_rewards_24h", 0)
            avg_earnings = (
                total_rewards // active_count if active_count > 0 else 0
            )

            # Create ProtocolMetrics row
            metrics = ProtocolMetrics(
                protocol=protocol_name,
                total_nodes=data.get("total_nodes", 0),
                active_nodes=active_count,
                total_rewards_24h=total_rewards,
                avg_earnings_per_node=avg_earnings,
                network_coverage=defaults.get("network_coverage", 0.0),
                token_price=defaults.get("token_price", 0.0),
                last_updated=int(time.time()),
            )
            db.add(metrics)

            # Create DePINNode entries
            for nd in nodes:
                node = DePINNode(
                    node_id=nd["node_id"],
                    protocol=protocol_name,
                    owner=nd["owner"],
                    status=nd["status"],
                    lat=nd.get("lat"),
                    lng=nd.get("lng"),
                    uptime_24h=nd.get("uptime_24h", 0.0),
                    earnings_24h=nd.get("earnings_24h", 0),
                    earnings_30d=nd.get("earnings_30d", 0),
                    last_heartbeat=int(time.time()),
                    metadata_json=nd.get("metadata_json", "{}"),
                )
                db.add(node)
                total_seeded += 1

        await db.commit()
        print(f"[seed] seeded {total_seeded} nodes across {len(collectors)} protocols")


@asynccontextmanager
async def lifespan(application: FastAPI):
    await init_db()
    await _seed_database()
    yield
    await engine.dispose()


app = FastAPI(title="SolRadar API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/protocols")
async def list_protocols(db: AsyncSession = Depends(get_session)):
    """List all supported DePIN protocol metrics."""
    result = await db.execute(select(ProtocolMetrics))
    rows = result.scalars().all()

    if rows:
        return {
            "protocols": [
                {
                    "name": r.protocol,
                    "total_nodes": r.total_nodes,
                    "active_nodes": r.active_nodes,
                    "total_rewards_24h": r.total_rewards_24h,
                    "avg_earnings_per_node": r.avg_earnings_per_node,
                    "token_price": r.token_price,
                    "network_coverage": r.network_coverage,
                }
                for r in rows
            ]
        }

    # Hardcoded fallback if DB is empty (safety net)
    return {
        "protocols": [
            {
                "name": "Helium",
                "total_nodes": 18,
                "active_nodes": 15,
                "total_rewards_24h": 720000,
                "avg_earnings_per_node": 48000,
                "token_price": 6.50,
                "network_coverage": 78.5,
            },
            {
                "name": "Hivemapper",
                "total_nodes": 12,
                "active_nodes": 10,
                "total_rewards_24h": 250000,
                "avg_earnings_per_node": 25000,
                "token_price": 0.032,
                "network_coverage": 12.3,
            },
            {
                "name": "Render",
                "total_nodes": 10,
                "active_nodes": 9,
                "total_rewards_24h": 2800000,
                "avg_earnings_per_node": 311111,
                "token_price": 8.20,
                "network_coverage": 45.0,
            },
        ]
    }


@app.get("/api/protocol/{name}/nodes")
async def protocol_nodes(name: str, db: AsyncSession = Depends(get_session)):
    """Get all nodes for a specific DePIN protocol."""
    result = await db.execute(
        select(DePINNode).where(DePINNode.protocol == name)
    )
    nodes = result.scalars().all()
    return {
        "protocol": name,
        "count": len(nodes),
        "nodes": [
            {
                "node_id": n.node_id,
                "owner": n.owner,
                "status": n.status,
                "lat": n.lat,
                "lng": n.lng,
                "uptime_24h": n.uptime_24h,
                "earnings_24h": n.earnings_24h,
                "earnings_30d": n.earnings_30d,
                "metadata_json": n.metadata_json,
            }
            for n in nodes
        ],
    }


@app.get("/api/user/{wallet}/nodes")
async def user_nodes(wallet: str, db: AsyncSession = Depends(get_session)):
    """Get all DePIN nodes owned by a wallet."""
    result = await db.execute(
        select(DePINNode).where(DePINNode.owner == wallet)
    )
    nodes = result.scalars().all()
    return {
        "wallet": wallet,
        "count": len(nodes),
        "nodes": [
            {
                "node_id": n.node_id,
                "protocol": n.protocol,
                "status": n.status,
                "earnings_24h": n.earnings_24h,
                "earnings_30d": n.earnings_30d,
                "uptime_24h": n.uptime_24h,
            }
            for n in nodes
        ],
    }


@app.get("/api/user/{wallet}/earnings")
async def user_earnings(wallet: str, db: AsyncSession = Depends(get_session)):
    """Get earning summary for a wallet across DePIN protocols."""
    result = await db.execute(
        select(DePINNode).where(DePINNode.owner == wallet)
    )
    nodes = result.scalars().all()

    by_protocol = {}
    for n in nodes:
        if n.protocol not in by_protocol:
            by_protocol[n.protocol] = {"earnings_24h": 0, "earnings_30d": 0, "node_count": 0}
        by_protocol[n.protocol]["earnings_24h"] += n.earnings_24h
        by_protocol[n.protocol]["earnings_30d"] += n.earnings_30d
        by_protocol[n.protocol]["node_count"] += 1

    return {
        "wallet": wallet,
        "total_earnings_24h": sum(p["earnings_24h"] for p in by_protocol.values()),
        "total_earnings_30d": sum(p["earnings_30d"] for p in by_protocol.values()),
        "protocols": by_protocol,
    }


@app.get("/api/compare/{wallet}")
async def compare_protocols(wallet: str, db: AsyncSession = Depends(get_session)):
    """Cross-protocol comparison for a wallet."""
    result = await db.execute(
        select(DePINNode).where(DePINNode.owner == wallet)
    )
    nodes = result.scalars().all()

    comparison = {}
    for n in nodes:
        if n.protocol not in comparison:
            comparison[n.protocol] = {
                "node_count": 0,
                "total_earnings_24h": 0,
                "avg_uptime": 0.0,
            }
        comparison[n.protocol]["node_count"] += 1
        comparison[n.protocol]["total_earnings_24h"] += n.earnings_24h
        comparison[n.protocol]["avg_uptime"] += n.uptime_24h

    for proto in comparison:
        cnt = comparison[proto]["node_count"]
        if cnt > 0:
            comparison[proto]["avg_uptime"] /= cnt

    return {"wallet": wallet, "comparison": comparison}


@app.post("/api/collect/{protocol}")
async def trigger_collect(protocol: str, db: AsyncSession = Depends(get_session)):
    """Manually trigger data collection for a protocol."""
    collectors = {
        "helium": fetch_helium_stats,
        "hivemapper": fetch_hivemapper_stats,
        "render": fetch_render_stats,
    }

    collector = collectors.get(protocol.lower())
    if not collector:
        raise HTTPException(status_code=400, detail=f"Unknown protocol: {protocol}")

    try:
        data = await collector()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Collection failed: {str(e)}")

    # Persist collected metrics into ProtocolMetrics table
    defaults = PROTOCOL_DEFAULTS.get(data.get("protocol", protocol), {})
    existing = await db.execute(
        select(ProtocolMetrics).where(ProtocolMetrics.protocol == data.get("protocol", protocol))
    )
    row = existing.scalar_one_or_none()

    active_count = data.get("active_nodes", 0)
    total_rewards = data.get("total_rewards_24h", 0)
    avg_earnings = total_rewards // active_count if active_count > 0 else 0

    if row:
        row.total_nodes = data.get("total_nodes", 0)
        row.active_nodes = active_count
        row.total_rewards_24h = total_rewards
        row.avg_earnings_per_node = avg_earnings
        row.token_price = defaults.get("token_price", row.token_price)
        row.network_coverage = defaults.get("network_coverage", row.network_coverage)
        row.last_updated = int(time.time())
    else:
        row = ProtocolMetrics(
            protocol=data.get("protocol", protocol),
            total_nodes=data.get("total_nodes", 0),
            active_nodes=active_count,
            total_rewards_24h=total_rewards,
            avg_earnings_per_node=avg_earnings,
            network_coverage=defaults.get("network_coverage", 0.0),
            token_price=defaults.get("token_price", 0.0),
            last_updated=int(time.time()),
        )
        db.add(row)
    await db.commit()

    return {"collected": True, "protocol": protocol, "result": data}
