"use client";

import { useState, useEffect } from "react";
import { ProtocolCard } from "@/components/ProtocolCard";
import { EarningsChart } from "@/components/EarningsChart";
import { NetworkMap } from "@/components/NetworkMap";
import { NodeList } from "@/components/NodeList";

const API_BASE = "/api";

// Demo wallet for pre-filled lookup
const DEMO_WALLET = "7xKzR5qhN8mCvPjE2nG4aT9bW1fS6dL3Y0p";

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

interface MapNode {
  lat: number;
  lng: number;
  protocol: string;
  status: string;
  node_id: string;
}

// Fallback protocol data when backend is unreachable
const FALLBACK_PROTOCOLS: ProtocolData[] = [
  { name: "Helium", total_nodes: 18, active_nodes: 15, total_rewards_24h: 720000, avg_earnings_per_node: 48000, token_price: 6.50, network_coverage: 78.5 },
  { name: "Hivemapper", total_nodes: 12, active_nodes: 10, total_rewards_24h: 250000, avg_earnings_per_node: 25000, token_price: 0.032, network_coverage: 12.3 },
  { name: "Render", total_nodes: 10, active_nodes: 9, total_rewards_24h: 2800000, avg_earnings_per_node: 311111, token_price: 8.20, network_coverage: 45.0 },
];

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return fallback;
    return await resp.json();
  } catch {
    return fallback;
  }
}

export default function DashboardPage() {
  const [protocolList, setProtocolList] = useState<ProtocolData[]>([]);
  const [allMapNodes, setAllMapNodes] = useState<MapNode[]>([]);
  const [walletInput, setWalletInput] = useState(DEMO_WALLET);
  const [earningsData, setEarningsData] = useState<UserEarnings | null>(null);
  const [nodeData, setNodeData] = useState<NodeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Fetch protocol overview + all nodes for the map on page load
  useEffect(() => {
    async function loadDashboard() {
      // Fetch protocol list
      const protocolResp = await fetchJson<{ protocols: ProtocolData[] }>(
        `${API_BASE}/protocols`,
        { protocols: FALLBACK_PROTOCOLS }
      );
      setProtocolList(protocolResp.protocols || FALLBACK_PROTOCOLS);

      // Fetch nodes from all three protocols for the map
      const protocolNames = ["Helium", "Hivemapper", "Render"];
      const nodePromises = protocolNames.map((name) =>
        fetchJson<{ nodes: MapNode[] }>(
          `${API_BASE}/protocol/${name}/nodes`,
          { nodes: [] }
        )
      );
      const nodeResults = await Promise.all(nodePromises);

      const combinedNodes: MapNode[] = [];
      nodeResults.forEach((result, idx) => {
        const proto = protocolNames[idx];
        for (const nd of result.nodes || []) {
          if (nd.lat != null && nd.lng != null) {
            combinedNodes.push({
              lat: nd.lat,
              lng: nd.lng,
              protocol: proto,
              status: nd.status || "Online",
              node_id: nd.node_id || "",
            });
          }
        }
      });

      setAllMapNodes(combinedNodes);
      setMapReady(true);
    }

    loadDashboard();
  }, []);

  async function handleLookup() {
    const trimmedWallet = walletInput.trim();
    if (!trimmedWallet) return;
    setIsLoading(true);

    try {
      const [earningsResp, nodesResp] = await Promise.all([
        fetchJson<UserEarnings>(
          `${API_BASE}/user/${trimmedWallet}/earnings`,
          { wallet: trimmedWallet, total_earnings_24h: 0, total_earnings_30d: 0, protocols: {} }
        ),
        fetchJson<{ nodes: NodeData[] }>(
          `${API_BASE}/user/${trimmedWallet}/nodes`,
          { nodes: [] }
        ),
      ]);
      setEarningsData(earningsResp);
      setNodeData(nodesResp.nodes || []);
    } catch {
      setEarningsData(null);
      setNodeData([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* protocol overview cards */}
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

      {/* global node map */}
      {mapReady && (
        <section>
          <NetworkMap nodes={allMapNodes} />
        </section>
      )}

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
            className="flex-1 bg-[#0a0a0f] border border-[#2a2a38] rounded px-3 py-2 text-sm text-white placeholder-[#5a5a6e] focus:border-blue-500 focus:outline-none font-mono"
          />
          <button
            onClick={handleLookup}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? "loading..." : "lookup"}
          </button>
        </div>
        <p className="text-[10px] text-[#5a5a6e] mt-2">
          Try the demo wallet: <button onClick={() => { setWalletInput(DEMO_WALLET); }} className="text-blue-400 hover:underline font-mono">{DEMO_WALLET.slice(0, 12)}...{DEMO_WALLET.slice(-4)}</button>
        </p>
      </section>

      {/* earnings chart + node list after lookup */}
      {earningsData && Object.keys(earningsData.protocols).length > 0 && (
        <section>
          <EarningsChart earningsData={earningsData} />
        </section>
      )}

      {nodeData.length > 0 && <NodeList nodeList={nodeData} />}
    </div>
  );
}
