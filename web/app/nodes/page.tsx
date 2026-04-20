"use client";

import { useState, useEffect } from "react";
import { NodeList } from "@/components/NodeList";

interface ProtocolOption {
  name: string;
}

interface NodeData {
  node_id: string;
  protocol: string;
  status: string;
  earnings_24h: number;
  earnings_30d: number;
  uptime_24h: number;
  owner?: string;
  lat?: number;
  lng?: number;
}

export default function NodesPage() {
  const [selectedProtocol, setSelectedProtocol] = useState("Helium");
  const [protocolNodes, setProtocolNodes] = useState<NodeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [protocols, setProtocols] = useState<ProtocolOption[]>([]);

  useEffect(() => {
    fetch("/api/protocols")
      .then((r) => r.json())
      .then((d) =>
        setProtocols(
          (d.protocols || []).map((p: { name: string }) => ({ name: p.name }))
        )
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProtocol) return;
    setIsLoading(true);
    fetch(`/api/protocol/${selectedProtocol}/nodes`)
      .then((r) => r.json())
      .then((d) => setProtocolNodes(d.nodes || []))
      .catch(() => setProtocolNodes([]))
      .finally(() => setIsLoading(false));
  }, [selectedProtocol]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-medium text-[#5a5a6e] uppercase tracking-wider">
          Network Nodes
        </h2>
        <div className="flex gap-1">
          {protocols.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedProtocol(p.name)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                selectedProtocol === p.name
                  ? "bg-blue-600 text-white"
                  : "bg-[#1a1a24] text-[#9898a8] hover:text-white"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[#5a5a6e] text-sm">
          loading nodes...
        </div>
      ) : protocolNodes.length > 0 ? (
        <NodeList nodeList={protocolNodes} />
      ) : (
        <div className="text-center py-12 text-[#5a5a6e] text-sm border border-dashed border-[#2a2a38] rounded-lg">
          no nodes found for {selectedProtocol}
        </div>
      )}
    </div>
  );
}
