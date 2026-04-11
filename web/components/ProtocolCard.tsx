"use client";

const PROTOCOL_COLORS: Record<string, string> = {
  Helium: "bg-blue-500",
  Hivemapper: "bg-orange-500",
  Render: "bg-purple-500",
};

const PROTOCOL_ICONS: Record<string, string> = {
  Helium: "H",
  Hivemapper: "Hm",
  Render: "R",
};

const PROTOCOL_TOKENS: Record<string, string> = {
  Helium: "HNT",
  Hivemapper: "HONEY",
  Render: "RNDR",
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
  const colorClass = PROTOCOL_COLORS[protocol.name] || "bg-gray-500";
  const iconLetter = PROTOCOL_ICONS[protocol.name] || "?";
  const tokenName = PROTOCOL_TOKENS[protocol.name] || "";
  const isPending = protocol.status === "pending";

  // Active percentage
  const activePercent =
    protocol.total_nodes > 0
      ? Math.round((protocol.active_nodes / protocol.total_nodes) * 100)
      : 0;

  return (
    <div className="border border-[#2a2a38] rounded-lg bg-[#111118] p-4 hover:border-[#3a3a48] transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-8 h-8 rounded-md ${colorClass} flex items-center justify-center text-white text-xs font-bold`}
        >
          {iconLetter}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{protocol.name}</h3>
          {isPending ? (
            <span className="text-[10px] text-[#5a5a6e]">awaiting data</span>
          ) : (
            tokenName && (
              <span className="text-[10px] text-[#5a5a6e]">
                {tokenName}
                {protocol.token_price != null && protocol.token_price > 0
                  ? ` · $${protocol.token_price.toFixed(protocol.token_price < 1 ? 3 : 2)}`
                  : ""}
              </span>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[#5a5a6e]">total nodes</span>
          <p className="text-white font-medium">
            {(protocol.total_nodes ?? 0).toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-[#5a5a6e]">active</span>
          <p className="text-green-400 font-medium">
            {(protocol.active_nodes ?? 0).toLocaleString()}
            <span className="text-[#5a5a6e] ml-1">({activePercent}%)</span>
          </p>
        </div>
        {protocol.total_rewards_24h != null && protocol.total_rewards_24h > 0 && (
          <div>
            <span className="text-[#5a5a6e]">rewards 24h</span>
            <p className="text-white font-medium">
              {(protocol.total_rewards_24h / 1_000_000).toFixed(2)} {tokenName}
            </p>
          </div>
        )}
        {protocol.network_coverage != null && protocol.network_coverage > 0 && (
          <div>
            <span className="text-[#5a5a6e]">coverage</span>
            <p className="text-white font-medium">
              {protocol.network_coverage.toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Active bar indicator */}
      {!isPending && protocol.total_nodes > 0 && (
        <div className="mt-3">
          <div className="h-1 rounded-full bg-[#1a1a24] overflow-hidden">
            <div
              className={`h-full rounded-full ${colorClass}`}
              style={{ width: `${activePercent}%`, opacity: 0.7 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
