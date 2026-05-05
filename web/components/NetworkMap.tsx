"use client";

import { useMemo } from "react";

interface MapNode {
  lat: number;
  lng: number;
  protocol: string;
  status: string;
  node_id?: string;
}

const PROTOCOL_COLORS: Record<string, string> = {
  Helium: "#3b82f6",
  Hivemapper: "#f97316",
  Render: "#a855f7",
};

const STATUS_OPACITY: Record<string, number> = {
  Online: 1.0,
  Active: 1.0,
  Offline: 0.35,
  Paused: 0.35,
  Maintenance: 0.35,
};

// Simplified world map outline — continent shapes as SVG paths
// Mercator-like projection: x = lng mapped to [0, 800], y = lat mapped to [0, 400]
function projectToSvg(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 800;
  const y = ((90 - lat) / 180) * 400;
  return { x, y };
}

// Simplified continent outlines for a stylized world map
const CONTINENT_PATHS = [
  // North America
  "M80,80 L130,60 L200,65 L230,80 L240,110 L220,140 L200,160 L180,170 L150,180 L120,160 L100,150 L80,120 Z",
  // South America
  "M160,190 L190,180 L210,200 L220,240 L210,280 L195,310 L180,330 L165,310 L155,270 L150,230 L155,200 Z",
  // Europe
  "M380,70 L420,60 L440,70 L450,80 L445,100 L430,110 L410,105 L390,100 L380,85 Z",
  // Africa
  "M380,120 L420,115 L450,130 L460,170 L450,220 L430,260 L410,270 L390,260 L380,220 L375,180 L378,140 Z",
  // Asia
  "M450,50 L520,40 L590,50 L640,60 L660,80 L650,110 L630,130 L600,140 L560,135 L520,130 L490,120 L470,110 L455,90 Z",
  // Oceania / Australia
  "M590,240 L640,230 L660,240 L665,265 L650,285 L620,290 L595,275 L585,255 Z",
  // Japan / Islands
  "M650,75 L658,70 L662,80 L655,90 L648,85 Z",
  // Southeast Asia
  "M580,150 L610,145 L625,155 L620,175 L600,185 L585,175 Z",
  // Greenland
  "M250,35 L290,30 L305,40 L300,55 L280,60 L255,50 Z",
];

export function NetworkMap({ nodes }: { nodes: MapNode[] }) {
  const dotsByProtocol = useMemo(() => {
    const grouped: Record<string, { x: number; y: number; status: string; node_id: string }[]> = {};
    for (const nd of nodes) {
      const proto = nd.protocol;
      if (!grouped[proto]) grouped[proto] = [];
      const { x, y } = projectToSvg(nd.lat, nd.lng);
      grouped[proto].push({ x, y, status: nd.status, node_id: nd.node_id || "" });
    }
    return grouped;
  }, [nodes]);

  const legendEntries = Object.keys(PROTOCOL_COLORS).filter(
    (p) => dotsByProtocol[p] && dotsByProtocol[p].length > 0
  );

  return (
    <div className="border border-[#2a2a38] rounded-lg bg-[#111118] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#9898a8]">Global Node Map</h3>
        <div className="flex items-center gap-3">
          {legendEntries.map((proto) => (
            <div key={proto} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: PROTOCOL_COLORS[proto] }}
              />
              <span className="text-[10px] text-[#5a5a6e]">
                {proto} ({dotsByProtocol[proto]?.length ?? 0})
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative rounded bg-[#0a0a0f] border border-[#1a1a24] overflow-hidden">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-auto"
          style={{ minHeight: 220 }}
        >
          {/* Background grid lines for visual texture */}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`vg-${i}`}
              x1={(i + 1) * 80}
              y1={0}
              x2={(i + 1) * 80}
              y2={400}
              stroke="#1a1a24"
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <line
              key={`hg-${i}`}
              x1={0}
              y1={(i + 1) * 80}
              x2={800}
              y2={(i + 1) * 80}
              stroke="#1a1a24"
              strokeWidth={0.5}
            />
          ))}

          {/* Continent outlines */}
          {CONTINENT_PATHS.map((d, idx) => (
            <path
              key={`continent-${idx}`}
              d={d}
              fill="#1a1a24"
              stroke="#2a2a38"
              strokeWidth={0.8}
            />
          ))}

          {/* Pulsing animation definitions */}
          <defs>
            <style>{`
              @keyframes nodePulse {
                0% { r: 4; opacity: 0.9; }
                50% { r: 7; opacity: 0.4; }
                100% { r: 4; opacity: 0.9; }
              }
              .node-pulse {
                animation: nodePulse 2s ease-in-out infinite;
              }
            `}</style>
          </defs>

          {/* Node dots */}
          {Object.entries(dotsByProtocol).map(([proto, dots]) =>
            dots.map((dot, idx) => {
              const color = PROTOCOL_COLORS[proto] || "#666";
              const opacity = STATUS_OPACITY[dot.status] ?? 0.6;
              const isActive = opacity > 0.5;
              return (
                <g key={`${proto}-${idx}`}>
                  {/* Pulse ring for active nodes */}
                  {isActive && (
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={4}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      opacity={0.3}
                      className="node-pulse"
                      style={{ animationDelay: `${idx * 0.15}s` }}
                    />
                  )}
                  {/* Solid dot */}
                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r={isActive ? 3.5 : 2.5}
                    fill={color}
                    opacity={opacity}
                  />
                  {/* Glow effect for active */}
                  {isActive && (
                    <circle
                      cx={dot.x}
                      cy={dot.y}
                      r={6}
                      fill={color}
                      opacity={0.1}
                    />
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Summary stats bar */}
      <div className="flex justify-between mt-3 text-[10px] text-[#5a5a6e]">
        <span>{nodes.length} total nodes</span>
        <span>
          {nodes.filter((n) => ["Online", "Active"].includes(n.status)).length} active
        </span>
        <span>
          {new Set(nodes.map((n) => n.protocol)).size} networks
        </span>
      </div>
    </div>
  );
}

// Keep the placeholder export for backward compatibility
export function NetworkMapPlaceholder() {
  return <NetworkMap nodes={[]} />;
}
