# SolRadar

Unified telemetry console for DePIN networks on Solana. Paste any wallet — we scan on-chain for Helium hotspots (with real H3-decoded locations), token balances, and reward flows across Helium, Hivemapper, and Render. Free, no sign-up, no API keys.

## Supported Networks

| Network     | Real telemetry                                    | Data source                                   |
|-------------|---------------------------------------------------|-----------------------------------------------|
| Helium      | Hotspot NFTs + H3 location + HNT/IOT/MOBILE flows | Helius DAS + RPC                              |
| Hivemapper  | HONEY balance + reward inflows                    | Solana RPC (per-driver GPS not public)        |
| Render      | RNDR balance + inflows + regional pools           | Solana RPC (GPU node geo not public)          |

## Coming Soon

Nosana · io.net · GRASS · WeatherXM · DIMO · Geodnet

## Features

- **Live mode** — paste any Solana wallet, scan in ~800ms via Helius
- **Radar map** — d3-geo Natural Earth projection, 124 seeded nodes across 6 continents, animated sweep
- **Provenance-first** — every metric tagged `on-chain` / `balance` / `region` / `aggregate` / `demo`
- **Honest gaps** — where data is private (Hivemapper GPS, Render GPU geo), we say so
- **Earnings breakdown** — 24h / 30d across all three protocols

## How it works

1. You paste any Solana wallet
2. Backend queries Helius DAS (compressed NFTs) + RPC (token balances) + enhanced-tx (reward flows)
3. H3 cells decode to lat/lng for Helium hotspots
4. UI renders verified snapshot with source badges

## Stack

| Layer     | Tech                                                 |
|-----------|------------------------------------------------------|
| Frontend  | Next.js 14, Tailwind, d3-geo + topojson-client, Recharts |
| Backend   | Python FastAPI + httpx + h3 + SQLAlchemy (async)     |
| Storage   | SQLite (seed cache)                                  |
| Fonts     | Instrument Serif · Instrument Sans · Chivo Mono      |
| Chain     | Solana mainnet via Helius                            |

## Dev Setup

```bash
# Backend (requires HELIUS_API_KEY in hackathon/.env.shared)
cd api
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8088

# Frontend
cd web
npm install
API_URL=http://localhost:8088 npm run dev
```

Web runs on `http://localhost:3000`, proxies `/api/*` to the backend.

## Test Wallets

Known-good Solana wallets for smoke-testing the `/live` endpoint:

| Address                                          | Holds                        |
|--------------------------------------------------|------------------------------|
| `6LY1JzAFVZsP2a2xKrtU6znQMQ5h4i7tocWdgrkZzkzF`   | HNT + HONEY + RNDR (best demo) |
| `CMwTLMPzarDRbGj9pbXU93Zkm7Qho3WxPbcgxpvDCH9r`   | 13.4M HNT                    |
| `Dyagmk9rQ9P4w2pREoSEKtZ5icrJmfdKq6HeQcqmP65X`   | 2.27M HNT                    |

## License

MIT
