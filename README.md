# SolRadar

Unified analytics dashboard for DePIN networks on Solana. Track your nodes, earnings, and uptime across Helium, Hivemapper, and Render in one place.

## Supported Networks

| Network | Metrics | Data Source |
|---------|---------|-------------|
| Helium | Hotspots, coverage, HNT rewards | Helium API |
| Hivemapper | Dashcams, mapped km, HONEY rewards | Hivemapper API |
| Render | GPU nodes, jobs completed, RNDR earnings | Render Network API |

## Features

- **Dashboard** -- protocol overview cards, earnings breakdown (24h + 30d), network map
- **Node Explorer** -- sortable table with status, uptime, and per-node earnings
- **Earnings Charts** -- bar chart comparison across protocols with time range toggle
- **Network Map** -- SVG global network map with Mercator projection

## How It Works

1. Enter your wallet address
2. Backend aggregates data from all three DePIN protocols
3. View unified dashboard with earnings, node status, and network map

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, Tailwind, Recharts, custom SVG map |
| Backend | Python FastAPI, async collectors |
| Storage | SQLite (local cache) |
| Font | Instrument Sans |

## Dev Setup

```bash
# Backend
cd api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd web
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`, proxies API calls to `:8000`.

## License

MIT
