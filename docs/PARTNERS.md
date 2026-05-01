# Partner networks

SolRadar aims to cover the entire on-Solana DePIN footprint plus selected
EVM-bridged networks that have substantial Solana-aligned user bases.

## Live (indexed)

| Network     | Type            | Token | Coverage         | Latency  | Notes                                    |
|-------------|-----------------|-------|------------------|----------|------------------------------------------|
| Helium      | Wireless (LoRa) | HNT   | global           | ~30s     | Hotspot lat/lng decoded from H3 cells    |
| Hivemapper  | Streetview      | HONEY | 80+ countries    | hourly   | Frame metadata sourced from cNFT mints   |
| Render      | GPU compute     | RNDR  | global pool      | minute   | Provider rewards aggregated daily        |

## Planned (Q2/Q3 2026)

| Network        | Type             | Token | Status                                   |
|----------------|------------------|-------|-------------------------------------------|
| Nosana         | GPU compute      | NOS   | API integration scheduled                |
| io.net         | GPU compute      | IO    | indexer being built                      |
| GRASS          | Bandwidth share  | GRASS | awaiting public node-id schema           |
| WeatherXM      | Weather sensors  | WXM   | bridging from EVM via Wormhole           |
| DIMO           | Vehicle telemetry| DIMO  | EVM-native, exploring shared dashboards  |
| Geodnet        | RTK precision GPS| GEOD  | API exists, integration pending          |
| Helium Mobile  | 5G hotspot       | MOBILE| same provider tree as Helium             |

## What we display per network

- **Map dots** — physical hotspot location, color-coded by protocol
- **Earnings** — daily token rewards, USD-converted at Pyth spot
- **Uptime** — % of last 30 days the node was online
- **Coverage** — for wireless: hex-cell density; for compute: GPU type

## Adding a new network

1. Drop a row in `web/lib/partners.ts` (id, label, color, icon, status)
2. Build a collector under `api/collectors/<name>_collector.py`
3. Map raw rows → `Node` model in `api/db/models.py`
4. Add a status badge in `ProtocolCard.tsx`
5. Bump this doc + README coverage table

> All collectors must respect the `--demo` flag and seed deterministic data
> when toggled, so the public site can always show *something* even if a
> partner API is rate-limited.
