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

interface ProtocolData {
  name: string;
  total_nodes: number;
  active_nodes: number;
  total_rewards_24h?: number;
  avg_earnings_per_node?: number;
  token_price?: number;
  status?: string;
}

export function ProtocolCard({ protocol }: { protocol: ProtocolData }) {
  const colorClass = PROTOCOL_COLORS[protocol.name] || "bg-gray-500";
  const iconLetter = PROTOCOL_ICONS[protocol.name] || "?";
  const isPending = protocol.status === "pending";

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
          {isPending && (
            <span className="text-[10px] text-[#5a5a6e]">awaiting data</span>
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
          </p>
        </div>
        {protocol.total_rewards_24h !== undefined && (
          <div>
            <span className="text-[#5a5a6e]">rewards 24h</span>
            <p className="text-white font-medium">
              ${(protocol.total_rewards_24h ?? 0).toLocaleString()}
            </p>
          </div>
        )}
        {protocol.avg_earnings_per_node !== undefined && (
          <div>
            <span className="text-[#5a5a6e]">avg/node</span>
            <p className="text-white font-medium">
              ${(protocol.avg_earnings_per_node ?? 0).toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
