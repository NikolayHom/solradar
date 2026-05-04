from sqlalchemy import Column, String, Integer, Float, BigInteger
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class DePINNode(Base):
    __tablename__ = "depin_nodes"

    node_id = Column(String, primary_key=True)
    protocol = Column(String, nullable=False, index=True)
    owner = Column(String, nullable=False, index=True)
    status = Column(String, default="Online")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    uptime_24h = Column(Float, default=0.0)
    earnings_24h = Column(BigInteger, default=0)
    earnings_30d = Column(BigInteger, default=0)
    last_heartbeat = Column(BigInteger, default=0)
    metadata_json = Column(String, default="{}")


class ProtocolMetrics(Base):
    __tablename__ = "protocol_metrics"

    protocol = Column(String, primary_key=True)
    total_nodes = Column(Integer, default=0)
    active_nodes = Column(Integer, default=0)
    total_rewards_24h = Column(BigInteger, default=0)
    avg_earnings_per_node = Column(BigInteger, default=0)
    network_coverage = Column(Float, default=0.0)
    token_price = Column(Float, default=0.0)
    last_updated = Column(BigInteger, default=0)
