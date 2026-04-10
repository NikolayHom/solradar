"""SolRadar API — DePIN analytics hub."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import init_db, engine, get_session
from db.models import DePINNode, ProtocolMetrics
from collectors.helium_collector import fetch_helium_stats
from collectors.hivemapper_collector import fetch_hivemapper_stats
from collectors.render_collector import fetch_render_stats


@asynccontextmanager
async def lifespan(application: FastAPI):
    await init_db()
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
                }
                for r in rows
            ]
        }

    # fallback: return defaults if no data collected yet
    return {
        "protocols": [
            {"name": "Helium", "total_nodes": 0, "active_nodes": 0, "status": "pending"},
            {"name": "Hivemapper", "total_nodes": 0, "active_nodes": 0, "status": "pending"},
            {"name": "Render", "total_nodes": 0, "active_nodes": 0, "status": "pending"},
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
    import time
    existing = await db.execute(
        select(ProtocolMetrics).where(ProtocolMetrics.protocol == data.get("protocol", protocol))
    )
    row = existing.scalar_one_or_none()
    if row:
        row.total_nodes = data.get("total_nodes", 0)
        row.active_nodes = data.get("active_nodes", 0)
        row.total_rewards_24h = data.get("total_rewards_24h", 0)
        row.last_updated = int(time.time())
    else:
        row = ProtocolMetrics(
            protocol=data.get("protocol", protocol),
            total_nodes=data.get("total_nodes", 0),
            active_nodes=data.get("active_nodes", 0),
            total_rewards_24h=data.get("total_rewards_24h", 0),
            last_updated=int(time.time()),
        )
        db.add(row)
    await db.commit()

    return {"collected": True, "protocol": protocol, "result": data}
