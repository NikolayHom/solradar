# SolRadar

Unified analytics dashboard for DePIN networks on Solana.

## Supported Networks

| Network | Data | Status |
|---------|------|--------|
| Helium | Hotspots, earnings, coverage | Planned |
| Hivemapper | Dashcams, map coverage, rewards | Planned |
| Render | GPU nodes, jobs, earnings | Planned |

## Core Action

Connect wallet → see your DePIN nodes on a map → track earnings and uptime across all networks in one place.

## Stack

- Next.js frontend with Mapbox
- Python/FastAPI data aggregation
- SQLite local cache
- Tailwind + custom chart components

## Dev

```bash
cd api && pip install -r requirements.txt && uvicorn main:app --reload
cd web && npm install && npm run dev
```

## Screenshots

> Screenshots will be added as features are built

## License

MIT
