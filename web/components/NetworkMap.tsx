"use client";

import { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";

interface MapNode {
  lat: number;
  lng: number;
  protocol: string;
  status: string;
  node_id?: string;
}

const PROTOCOL_COLORS: Record<string, string> = {
  Helium: "#22d3ee",
  Hivemapper: "#fb923c",
  Render: "#a78bfa",
};

const STATUS_OPACITY: Record<string, number> = {
  Online: 1.0,
  Active: 1.0,
  Offline: 0.35,
  Paused: 0.35,
  Maintenance: 0.35,
};

const VIEW_W = 820;
const VIEW_H = 420;

export function NetworkMap({ nodes, radar = false }: { nodes: MapNode[]; radar?: boolean }) {
  const [countries, setCountries] = useState<Feature<Geometry>[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/world-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (!alive) return;
        const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection;
        setCountries(fc.features);
      })
      .catch(() => setCountries([]));
    return () => {
      alive = false;
    };
  }, []);

  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .scale(155)
        .translate([VIEW_W / 2, VIEW_H / 2 + 10]),
    []
  );

  const pathGen = useMemo(() => geoPath(projection), [projection]);
  const graticulePath = useMemo(() => pathGen(geoGraticule10()) ?? "", [pathGen]);
  const spherePath = useMemo(() => pathGen({ type: "Sphere" } as any) ?? "", [pathGen]);

  const countryPaths = useMemo(() => {
    if (!countries) return [];
    return countries
      .map((f, i) => ({ id: (f.id as string) ?? String(i), d: pathGen(f) ?? "" }))
      .filter((c) => c.d.length > 0);
  }, [countries, pathGen]);

  const dotsByProtocol = useMemo(() => {
    const grouped: Record<
      string,
      { x: number; y: number; status: string; node_id: string }[]
    > = {};
    for (const nd of nodes) {
      const projected = projection([nd.lng, nd.lat]);
      if (!projected) continue;
      const [x, y] = projected;
      const proto = nd.protocol;
      if (!grouped[proto]) grouped[proto] = [];
      grouped[proto].push({ x, y, status: nd.status, node_id: nd.node_id || "" });
    }
    return grouped;
  }, [nodes, projection]);

  const legendEntries = Object.keys(PROTOCOL_COLORS).filter(
    (p) => dotsByProtocol[p] && dotsByProtocol[p].length > 0
  );

  return (
    <div className={radar ? "" : "border border-[#2a2a38] rounded-lg bg-[#111118] p-4"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[color:var(--aqua,#22d3ee)]">
            ◉ sweeping
          </span>
          <span className="text-[10px] font-mono text-[color:var(--text-3,#5a6478)]">
            {nodes.length} signals
          </span>
        </div>
        <div className="flex items-center gap-3">
          {legendEntries.map((proto) => (
            <div key={proto} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: PROTOCOL_COLORS[proto] }}
              />
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[color:var(--text-3,#5a6478)]">
                {proto} · {dotsByProtocol[proto]?.length ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative rounded-lg bg-[#05070f] border border-[rgba(34,211,238,0.18)] overflow-hidden">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto"
          style={{ minHeight: 240 }}
        >
          <defs>
            <radialGradient id="ocean-grad" cx="50%" cy="45%" r="75%">
              <stop offset="0%" stopColor="#0a1426" />
              <stop offset="100%" stopColor="#05070f" />
            </radialGradient>
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
            </linearGradient>
            <style>{`
              @keyframes nodePulse {
                0%   { r: 4; opacity: 0.9; }
                50%  { r: 7; opacity: 0.4; }
                100% { r: 4; opacity: 0.9; }
              }
              .node-pulse { animation: nodePulse 2s ease-in-out infinite; }
              @keyframes svgSweep {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
              }
              .map-sweep {
                transform-origin: ${VIEW_W / 2}px ${VIEW_H / 2 + 10}px;
                animation: svgSweep 9s linear infinite;
              }
            `}</style>
          </defs>

          {/* Sphere (ocean) */}
          <path d={spherePath} fill="url(#ocean-grad)" stroke="rgba(34,211,238,0.15)" strokeWidth={0.6} />

          {/* Radial glow from center */}
          {radar && (
            <circle
              cx={VIEW_W / 2}
              cy={VIEW_H / 2 + 10}
              r={Math.max(VIEW_W, VIEW_H) / 2}
              fill="url(#radar-glow)"
            />
          )}

          {/* Graticule (lat/lng grid) */}
          <path
            d={graticulePath}
            fill="none"
            stroke="rgba(34,211,238,0.08)"
            strokeWidth={0.4}
            strokeDasharray="1.5 2"
          />

          {/* Countries */}
          {countryPaths.map((c) => (
            <path
              key={c.id}
              d={c.d}
              fill="#0e1830"
              stroke="rgba(34,211,238,0.18)"
              strokeWidth={0.5}
              strokeLinejoin="round"
            />
          ))}

          {/* Radar sweep wedge */}
          {radar && (
            <g className="map-sweep" opacity={0.5}>
              <path
                d={`M ${VIEW_W / 2} ${VIEW_H / 2 + 10} L ${VIEW_W / 2 + 500} ${VIEW_H / 2 + 10} A 500 500 0 0 0 ${
                  VIEW_W / 2 + 500 * Math.cos(-Math.PI / 3)
                } ${VIEW_H / 2 + 10 + 500 * Math.sin(-Math.PI / 3)} Z`}
                fill="url(#sweep-grad)"
              />
            </g>
          )}

          {/* Concentric range rings */}
          {radar && (
            <g opacity={0.22}>
              {[80, 140, 200].map((r) => (
                <circle
                  key={r}
                  cx={VIEW_W / 2}
                  cy={VIEW_H / 2 + 10}
                  r={r}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={0.4}
                  strokeDasharray="2 3"
                />
              ))}
            </g>
          )}

          {/* Node dots */}
          {Object.entries(dotsByProtocol).map(([proto, dots]) =>
            dots.map((dot, idx) => {
              const color = PROTOCOL_COLORS[proto] || "#666";
              const opacity = STATUS_OPACITY[dot.status] ?? 0.6;
              const isActive = opacity > 0.5;
              return (
                <g key={`${proto}-${idx}`}>
                  {isActive && (
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={6}
                      fill={color}
                      opacity={0.12}
                    />
                  )}
                  {isActive && (
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={4}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.3}
                      opacity={0.35}
                      className="node-pulse"
                      style={{ animationDelay: `${idx * 0.15}s` }}
                    />
                  )}
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={isActive ? 3.2 : 2.3}
                    fill={color}
                    opacity={opacity}
                  />
                </g>
              );
            })
          )}
        </svg>

        {!countries && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#5a5a6e]">
            loading map…
          </div>
        )}
      </div>

      <div className="flex justify-between mt-3 text-[10px] text-[#5a5a6e]">
        <span>{nodes.length} total nodes</span>
        <span>
          {nodes.filter((n) => ["Online", "Active"].includes(n.status)).length} active
        </span>
        <span>{new Set(nodes.map((n) => n.protocol)).size} networks</span>
      </div>
    </div>
  );
}

export function NetworkMapPlaceholder() {
  return <NetworkMap nodes={[]} />;
}
