"use client";

const PROTOCOL_COLORS: Record<string, string> = {
  Helium: "#22d3ee",
  Hivemapper: "#fb923c",
  Render: "#a78bfa",
};

const PROTOCOL_TOKENS: Record<string, string> = {
  Helium: "HNT",
  Hivemapper: "HONEY",
  Render: "RNDR",
};

const PROTOCOL_GLYPHS: Record<string, string> = {
  Helium: "◉",
  Hivemapper: "◈",
  Render: "▲",
};

const PROTOCOL_TAGLINE: Record<string, string> = {
  Helium: "LoRaWAN · 5G · IoT routing",
  Hivemapper: "decentralised street map",
  Render: "GPU compute for creators",
};

interface ProtocolData {
  name: string;
  total_nodes: number;
  active_nodes: number;
  total_rewards_24h?: number;
  avg_earnings_per_node?: number;
  token_price?: number;
  network_coverage?: number;
  status?: string;
}

export function ProtocolCard({ protocol }: { protocol: ProtocolData }) {
  const color = PROTOCOL_COLORS[protocol.name] || "#94a3b8";
  const glyph = PROTOCOL_GLYPHS[protocol.name] || "◌";
  const tokenName = PROTOCOL_TOKENS[protocol.name] || "";
  const tagline = PROTOCOL_TAGLINE[protocol.name] || "";
  const isPending = protocol.status === "pending";

  const activePercent =
    protocol.total_nodes > 0
      ? Math.round((protocol.active_nodes / protocol.total_nodes) * 100)
      : 0;

  return (
    <div className="panel reticle p-5 group relative overflow-hidden transition-colors hover:border-aqua">
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between mb-4 relative">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl" style={{ color }}>{glyph}</span>
            <h3 className="text-[16px] font-semibold text-white">{protocol.name}</h3>
          </div>
          <p className="text-[10px] font-mono text-dimmer uppercase tracking-[0.15em]">
            {tagline}
          </p>
        </div>
        {tokenName && (
          <div className="text-right">
            <div className="text-[10px] font-mono text-dimmer uppercase tracking-[0.15em]">
              {tokenName}
            </div>
            {protocol.token_price != null && protocol.token_price > 0 && (
              <div className="text-[13px] font-mono text-white">
                ${protocol.token_price.toFixed(protocol.token_price < 1 ? 3 : 2)}
              </div>
            )}
          </div>
        )}
      </div>

      {isPending ? (
        <div className="text-[11px] font-mono text-dimmer uppercase tracking-[0.15em] relative">
          awaiting data
        </div>
      ) : (
        <>
          <div className="relative flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono text-dimmer uppercase tracking-[0.18em] mb-1">
                nodes tracked
              </div>
              <div className="font-serif text-[34px] leading-none text-white">
                {(protocol.total_nodes ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-dimmer uppercase tracking-[0.18em] mb-1">
                active
              </div>
              <div className="font-serif text-[22px] leading-none text-[color:var(--emerald)]">
                {(protocol.active_nodes ?? 0).toLocaleString()}
                <span className="text-[11px] font-mono text-dimmer ml-1">{activePercent}%</span>
              </div>
            </div>
          </div>

          <div className="h-[2px] rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden mb-4 relative">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${activePercent}%`, background: color, boxShadow: `0 0 8px ${color}` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] font-mono relative">
            {protocol.total_rewards_24h != null && protocol.total_rewards_24h > 0 && (
              <div>
                <div className="text-dimmer uppercase tracking-[0.15em] mb-0.5">rewards 24h</div>
                <div className="text-white">
                  {(protocol.total_rewards_24h / 1_000_000).toFixed(2)}M {tokenName}
                </div>
              </div>
            )}
            {protocol.network_coverage != null && protocol.network_coverage > 0 && (
              <div>
                <div className="text-dimmer uppercase tracking-[0.15em] mb-0.5">coverage</div>
                <div className="text-white">{protocol.network_coverage.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
