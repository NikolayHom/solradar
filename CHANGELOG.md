# changelog

## phase 5 — live mode + telemetry redesign

- live on-chain mode via Helius DAS + RPC + enhanced-tx
- H3 hexagon → lat/lng decoder for hotspot location resolution
- 124 seeded nodes across 6 continents for the demo dataset
- satellite telemetry redesign: Instrument Serif + Chivo Mono + aqua palette
- world-atlas TopoJSON map with radar sweep
- ModeBadge with LIVE / DEMO / empty variants
- LivePanel with provenance badges
- coming-soon section listing 6 real DePIN partners (Helium, Hivemapper, Render, IO.NET, Pollen, Geodnet)
- 2 parallel code reviews, 7 bugs fixed
- test wallet 6LY1JzAF... activates all 3 protocols in live mode

## phase 4 — collectors + map

- helium / hivemapper / render collectors with retry-on-429
- mapbox map with hex hover + zoom-to-cluster
- protocol cards with earnings + uptime aggregates

## phase 3 — fastapi + sqlite

- fastapi server with `/protocols`, `/nodes`, `/healthz`
- sqlite persistence with continent column for filtering
- aggregator service merging collector output across protocols
