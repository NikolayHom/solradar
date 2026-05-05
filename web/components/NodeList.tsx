"use client";

interface NodeData {
  node_id: string;
  protocol: string;
  status: string;
  earnings_24h: number;
  earnings_30d: number;
  uptime_24h: number;
}

const STATUS_COLORS: Record<string, string> = {
  Online: "text-green-400",
  Offline: "text-red-400",
  Degraded: "text-orange-400",
};

export function NodeList({ nodeList }: { nodeList: NodeData[] }) {
  return (
    <div className="border border-[#2a2a38] rounded-lg bg-[#111118] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2a2a38]">
        <h3 className="text-sm font-medium text-[#9898a8]">
          Your Nodes ({nodeList.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#2a2a38] text-[#5a5a6e]">
              <th className="text-left px-4 py-2 font-medium">Node ID</th>
              <th className="text-left px-4 py-2 font-medium">Protocol</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Uptime 24h</th>
              <th className="text-right px-4 py-2 font-medium">Earned 24h</th>
              <th className="text-right px-4 py-2 font-medium">Earned 30d</th>
            </tr>
          </thead>
          <tbody>
            {nodeList.map((nodeItem) => (
              <tr
                key={nodeItem.node_id}
                className="border-b border-[#1a1a24] hover:bg-[#1a1a24] transition-colors"
              >
                <td className="px-4 py-2 text-white font-mono text-[11px]">
                  {nodeItem.node_id.length > 16
                    ? `${nodeItem.node_id.slice(0, 8)}...${nodeItem.node_id.slice(-6)}`
                    : nodeItem.node_id}
                </td>
                <td className="px-4 py-2 text-[#9898a8]">{nodeItem.protocol}</td>
                <td className="px-4 py-2">
                  <span className={STATUS_COLORS[nodeItem.status] || "text-gray-400"}>
                    {nodeItem.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-[#9898a8]">
                  {(nodeItem.uptime_24h ?? 0).toFixed(1)}%
                </td>
                <td className="px-4 py-2 text-right text-white">
                  ${(nodeItem.earnings_24h ?? 0).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right text-white">
                  ${(nodeItem.earnings_30d ?? 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
