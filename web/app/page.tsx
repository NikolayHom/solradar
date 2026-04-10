"use client";

import { useState, useEffect } from "react";
import { ProtocolCard } from "@/components/ProtocolCard";
import { EarningsChart } from "@/components/EarningsChart";
import { NetworkMapPlaceholder } from "@/components/NetworkMap";
import { NodeList } from "@/components/NodeList";

interface ProtocolData {
  name: string;
  total_nodes: number;
  active_nodes: number;
  total_rewards_24h?: number;
  avg_earnings_per_node?: number;
  token_price?: number;
  status?: string;
}

interface UserEarnings {
  wallet: string;
  total_earnings_24h: number;
  total_earnings_30d: number;
  protocols: Record<string, { earnings_24h: number; earnings_30d: number; node_count: number }>;
}

interface NodeData {
  node_id: string;
  protocol: string;
  status: string;
  earnings_24h: number;
  earnings_30d: number;
  uptime_24h: number;
}

export default function DashboardPage() {
  const [protocolList, setProtocolList] = useState<ProtocolData[]>([]);
  const [walletInput, setWalletInput] = useState("");
  const [earningsData, setEarningsData] = useState<UserEarnings | null>(null);
  const [nodeData, setNodeData] = useState<NodeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/protocols")
      .then((r) => r.json())
      .then((d) => setProtocolList(d.protocols || []))
      .catch(() => {});
  }, []);

  async function handleLookup() {
    const trimmedWallet = walletInput.trim();
    if (!trimmedWallet) return;
    setIsLoading(true);

    try {
      const [earningsResp, nodesResp] = await Promise.all([
        fetch(`/api/user/${trimmedWallet}/earnings`),
        fetch(`/api/user/${trimmedWallet}/nodes`),
      ]);
      const earningsJson = await earningsResp.json();
      const nodesJson = await nodesResp.json();
      setEarningsData(earningsJson);
      setNodeData(nodesJson.nodes || []);
    } catch {
      setEarningsData(null);
      setNodeData([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* protocol overview */}
      <section>
        <h2 className="text-sm font-medium text-[#5a5a6e] uppercase tracking-wider mb-3">
          Supported Networks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {protocolList.map((proto) => (
            <ProtocolCard key={proto.name} protocol={proto} />
          ))}
        </div>
      </section>

      {/* wallet lookup */}
      <section className="border border-[#2a2a38] rounded-lg bg-[#111118] p-4">
        <h2 className="text-sm font-medium text-[#5a5a6e] uppercase tracking-wider mb-3">
          Your DePIN Portfolio
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter wallet address..."
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="flex-1 bg-[#0a0a0f] border border-[#2a2a38] rounded px-3 py-2 text-sm text-white placeholder-[#5a5a6e] focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleLookup}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? "loading..." : "lookup"}
          </button>
        </div>
      </section>

      {/* earnings + map */}
      {earningsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EarningsChart earningsData={earningsData} />
          <NetworkMapPlaceholder />
        </div>
      )}

      {/* node list */}
      {nodeData.length > 0 && <NodeList nodeList={nodeData} />}
    </div>
  );
}
