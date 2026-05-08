# SolRadar

Unified telemetry console for DePIN networks on Solana. Paste any wallet — we scan on-chain for Helium hotspots (with real H3-decoded locations), token balances, and reward flows across Helium, Hivemapper, and Render. Free, no sign-up, no API keys.

## Supported Networks

| Network     | Coverage  | Real telemetry                                    | Data source                                   |
|-------------|-----------|---------------------------------------------------|-----------------------------------------------|
| Helium      | live      | Hotspot NFTs + H3 location + HNT/IOT/MOBILE flows | Helius DAS + RPC + enhanced-tx                |
| Hivemapper  | live      | HONEY balance + reward inflows                    | Solana RPC (per-driver GPS not public)        |
| Render      | live      | RNDR balance + inflows + regional pools           | Solana RPC (GPU node geo not public)          |
| Nosana      | planned   | Job queue + worker uptime aggregates              | Solana RPC + Nosana indexer (when public)     |
| io.net      | planned   | GPU device count + price tier distribution        | io.net public API (rate-limited)              |
| GRASS       | exploring | Bandwidth-share rewards by IP region              | Off-chain (need partner agreement)            |
| WeatherXM   | planned   | Station readings (PM, temp, humidity)             | WeatherXM public API + on-chain attestations  |
| DIMO        | exploring | Vehicle telemetry rollups                         | DIMO Network endpoints                        |
| Geodnet     | planned   | RTK reference station uptime                      | Geodnet API + on-chain reward claims          |

## Metric Definitions

We aggregate three things and label every number with how we got it:

| Metric            | What it means                                   | Tag      |
|-------------------|-------------------------------------------------|----------|
| `node_uptime`     | % of last 24h where the node reported data     | `on-chain` (Helium) / `aggregate` (Hivemapper / Render) |
| `earnings_24h`    | Token rewards observed in the wallet window    | `on-chain` (all networks) |
| `hex_id`          | H3 cell at resolution `r` for hotspot location | `on-chain` (Helium) / `region` (others) |
| `h3_resolution`   | H3 grid level — 7 (city block) is the default  | always `on-chain` |
| `network_coverage`| Region-level rollup we compute                 | `aggregate` |

Anything we cannot derive on-chain is tagged `demo` and only used in seeded mode.

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
