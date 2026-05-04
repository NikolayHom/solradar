# Sample API queries

Quick reference for hitting the SolRadar API. All endpoints return JSON.

Replace `BASE_URL` with your local or deployed gateway (default: `http://localhost:8000`).

## /live — operating mode

Reports whether the backend is running on real on-chain data or seeded demo data.

```bash
curl -s $BASE_URL/live | jq
```

```json
{
  "mode": "live",
  "rpc": "https://mainnet.helius-rpc.com",
  "last_sync": "2026-04-30T22:14:11Z"
}
```

## /protocols — supported networks

Returns all currently indexed DePIN protocols.

```bash
curl -s $BASE_URL/protocols | jq
```

```json
[
  { "id": "helium",     "label": "Helium",     "color": "aqua",   "active": true  },
  { "id": "hivemapper", "label": "Hivemapper", "color": "orange", "active": true  },
  { "id": "render",     "label": "Render",     "color": "violet", "active": true  }
]
```

## /user/:wallet/nodes — wallet's nodes

Returns all DePIN hardware tied to a wallet across protocols.

```bash
curl -s $BASE_URL/user/6LY1JzAFVZsP2a2xKrtU6znQMQ5h4i7tocWdgrkZzkzF/nodes | jq '.[0]'
```

```json
{
  "protocol": "helium",
  "node_id": "112FXYZ...",
  "lat": 50.45,
  "lng": 30.52,
  "online": true,
  "uptime_pct": 98.7
}
```

## /user/:wallet/earnings — earnings rollup

Daily earnings for the past 30 days, per protocol.

```bash
curl -s "$BASE_URL/user/6LY1JzAFVZsP2a2xKrtU6znQMQ5h4i7tocWdgrkZzkzF/earnings?days=30" | jq
```

```json
{
  "totals": { "helium": 17480.23, "hivemapper": 2440.05, "render": 5610.71 },
  "series": [
    { "date": "2026-04-01", "helium": 532, "hivemapper": 80, "render": 200 }
  ]
}
```

> The wallet `6LY1JzAFVZsP2a2xKrtU6znQMQ5h4i7tocWdgrkZzkzF` activates all three
> protocols at once and is safe to use for demos.
