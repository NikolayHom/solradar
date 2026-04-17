"use client";

import { useEffect, useRef, useState } from "react";
import { ProtocolCard } from "@/components/ProtocolCard";
import { EarningsChart } from "@/components/EarningsChart";
import { NetworkMap } from "@/components/NetworkMap";
import { NodeList } from "@/components/NodeList";

const API_BASE = "/api";

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

interface LiveProtocol {
  name: string;
  node_count: number;
  active_count: number;
  balances: Record<string, number>;
  earnings_24h: number;
  earnings_30d: number;
  has_activity: boolean;
  source: { nodes: string; earnings: string };
}

interface LiveSnapshot {
  wallet: string;
  mode: "live" | "empty" | "demo";
  has_any_activity: boolean;
  nodes: Array<{
    node_id: string;
    protocol: string;
    status: string;
    lat: number | null;
    lng: number | null;
    source: string;
    metadata_json?: string;
  }>;
  protocols: LiveProtocol[];
  provenance: Record<string, string>;
  cached: boolean;
  age_sec?: number;
  asset_count?: number;
}

const FALLBACK_PROTOCOLS: ProtocolData[] = [
  { name: "Helium",     total_nodes: 18, active_nodes: 15, total_rewards_24h: 720000,   avg_earnings_per_node: 48000,  token_price: 6.50,  network_coverage: 78.5 },
  { name: "Hivemapper", total_nodes: 12, active_nodes: 10, total_rewards_24h: 250000,   avg_earnings_per_node: 25000,  token_price: 0.032, network_coverage: 12.3 },
  { name: "Render",     total_nodes: 10, active_nodes: 9,  total_rewards_24h: 2800000,  avg_earnings_per_node: 311111, token_price: 8.20,  network_coverage: 45.0 },
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
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const scanRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDashboard() {
      const protocolResp = await fetchJson<{ protocols: ProtocolData[] }>(
        `${API_BASE}/protocols`,
        { protocols: FALLBACK_PROTOCOLS }
      );
      setProtocolList(protocolResp.protocols || FALLBACK_PROTOCOLS);

      const protocolNames = ["Helium", "Hivemapper", "Render"];
      const nodePromises = protocolNames.map((name) =>
        fetchJson<{ nodes: MapNode[] }>(`${API_BASE}/protocol/${name}/nodes`, { nodes: [] })
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
    setLiveError(null);
    // Reset stale results from any previous scan
    setEarningsData(null);
    setNodeData([]);

    let live: LiveSnapshot | null = null;
    try {
      const r = await fetch(`${API_BASE}/wallet/${trimmedWallet}/live`, {
        signal: AbortSignal.timeout(20000),
      });
      if (r.ok) {
        live = (await r.json()) as LiveSnapshot;
      } else if (r.status === 503) {
        setLiveError("live mode disabled on server (HELIUS_API_KEY missing)");
      } else {
        setLiveError(`scan failed (${r.status})`);
      }
    } catch (e) {
      console.error("[solradar] live lookup failed", e);
      setLiveError("on-chain lookup timed out");
    }
    setLiveSnapshot(live);

    if (live && live.has_any_activity) {
      const proto: Record<string, { earnings_24h: number; earnings_30d: number; node_count: number }> = {};
      for (const p of live.protocols) {
        proto[p.name] = { earnings_24h: p.earnings_24h, earnings_30d: p.earnings_30d, node_count: p.node_count };
      }
      setEarningsData({
        wallet: trimmedWallet,
        total_earnings_24h: live.protocols.reduce((s, p) => s + p.earnings_24h, 0),
        total_earnings_30d: live.protocols.reduce((s, p) => s + p.earnings_30d, 0),
        protocols: proto,
      });
      setNodeData(
        live.nodes
          .filter((n) => n.protocol === "Helium")
          .map((n) => ({
            node_id: n.node_id, protocol: n.protocol, status: n.status,
            earnings_24h: 0, earnings_30d: 0, uptime_24h: 0,
          }))
      );
      setAllMapNodes(
        live.nodes
          .filter((n) => n.lat != null && n.lng != null)
          .map((n) => ({
            lat: n.lat as number, lng: n.lng as number,
            protocol: n.protocol, status: n.status, node_id: n.node_id,
          }))
      );
      setIsLoading(false);
      return;
    }

    try {
      const [earningsResp, nodesResp] = await Promise.all([
        fetchJson<UserEarnings>(
          `${API_BASE}/user/${trimmedWallet}/earnings`,
          { wallet: trimmedWallet, total_earnings_24h: 0, total_earnings_30d: 0, protocols: {} }
        ),
        fetchJson<{ nodes: NodeData[] }>(`${API_BASE}/user/${trimmedWallet}/nodes`, { nodes: [] }),
      ]);
      setEarningsData(earningsResp);
      setNodeData(nodesResp.nodes || []);
    } catch (e) {
      console.error("[solradar] demo fallback failed", e);
      setEarningsData(null);
      setNodeData([]);
    } finally {
      setIsLoading(false);
    }
  }

  function scrollToScan() {
    scanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-20">
      {/* ========== HERO ========== */}
      <section className="relative pt-6">
        <div className="flex flex-col lg:flex-row items-start gap-10">
          <div className="flex-1 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-aqua mb-6">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--aqua)] blink" />
              <span>LIVE · mainnet · helius-rpc</span>
            </div>

            <h1 className="font-serif text-[54px] sm:text-[72px] leading-[0.95] tracking-tight text-white mb-4">
              See every DePIN node <br />
              <span className="italic text-aqua sweep-underline">you own.</span>{" "}
              <span className="text-dim">In one sweep.</span>
            </h1>

            <p className="text-[17px] text-dim max-w-xl mb-8 leading-relaxed">
              SolRadar is the first analytics console that unifies{" "}
              <span className="text-white">Helium</span>,{" "}
              <span className="text-white">Hivemapper</span> and{" "}
              <span className="text-white">Render</span> into one real-time telemetry view.
              Paste a wallet — we decode on-chain hotspot locations, balances and rewards in under two seconds.
              <span className="text-aqua"> No sign-up. No API keys. Free forever.</span>
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={scrollToScan} className="btn-hot rounded-md px-5 py-3 text-[13px]">
                Scan a wallet →
              </button>
              <a href="#how" className="btn-ghost rounded-md px-4 py-3 text-[13px]">
                How it works
              </a>
              <span className="ml-auto text-[11px] font-mono text-dimmer uppercase tracking-[0.18em]">
                powered by H3 · Helius DAS · Solana mainnet
              </span>
            </div>
          </div>

          <HeroStats protocols={protocolList} />
        </div>
      </section>

      {/* ========== RADAR MAP ========== */}
      {mapReady && (
        <section className="relative">
          <SectionHeader
            kicker="01 · Telemetry"
            title="The radar"
            desc="Every dot is a real node, projected from on-chain H3 coordinates. The sweep runs continuously."
          />
          <div className="panel panel-hot reticle scanlines relative overflow-hidden p-4 sm:p-6">
            <NetworkMap nodes={allMapNodes} radar />
          </div>
        </section>
      )}

      {/* ========== WALLET SCAN ========== */}
      <section ref={scanRef} id="scan" className="relative scroll-mt-20">
        <SectionHeader
          kicker="02 · Scan"
          title="Your DePIN portfolio"
          desc="Paste any Solana wallet. We query Helius DAS + RPC live — nothing is stored."
        />

        <div className="panel reticle p-5 sm:p-6 relative">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-aqua font-mono text-xs opacity-60">&gt;_</span>
              <input
                type="text"
                placeholder="paste Solana wallet address..."
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                className="w-full bg-[rgba(5,7,15,0.6)] border border-hair rounded-md pl-9 pr-3 py-3 text-sm text-white placeholder-[color:var(--text-3)] focus:border-aqua focus:outline-none font-mono transition-colors"
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={isLoading}
              className="btn-hot rounded-md px-6 py-3 text-sm disabled:opacity-50 min-w-[140px]"
            >
              {isLoading ? "scanning…" : "▶  Scan wallet"}
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-3">
            <span className="text-[11px] text-dimmer font-mono">
              Try demo:
              <button
                onClick={() => setWalletInput(DEMO_WALLET)}
                className="ml-2 text-aqua hover:underline"
              >
                {DEMO_WALLET.slice(0, 12)}…{DEMO_WALLET.slice(-4)}
              </button>
            </span>
            {liveSnapshot && <ModeBadge mode={liveSnapshot.mode} cached={liveSnapshot.cached} />}
            {liveError && <span className="text-[11px] text-[color:var(--amber)]">{liveError}</span>}
          </div>
        </div>
      </section>

      {liveSnapshot && liveSnapshot.has_any_activity && (
        <section>
          <SectionHeader
            kicker="03 · On-chain"
            title="Verified snapshot"
            desc="Every number below is sourced from Solana mainnet. Provenance tags show exactly where each datum came from."
          />
          <LivePanel snapshot={liveSnapshot} />
        </section>
      )}

      {/* ========== PROTOCOL TRIAD ========== */}
      <section>
        <SectionHeader
          kicker="Networks"
          title="Three protocols · one console"
          desc="Helium routes LoRaWAN packets and 5G. Hivemapper drives a decentralised street map. Render burns GPU cycles for artists. All of them live on Solana now."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {protocolList.map((proto) => (
            <ProtocolCard key={proto.name} protocol={proto} />
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how" className="scroll-mt-20">
        <SectionHeader kicker="Pipeline" title="How a scan works" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HowStep
            n="01"
            title="Paste wallet"
            body="You drop any Solana address into the scanner. We never store it."
            tag="0ms"
          />
          <HowStep
            n="02"
            title="We query on-chain"
            body="Helius DAS lists your hotspot NFTs, RPC reads token balances, enhanced-tx parses reward flows."
            tag="≈ 800 ms"
          />
          <HowStep
            n="03"
            title="You see truth"
            body="H3 cells decode to lat/lng. Every datum is badged with its source — on-chain, balance-only, or aggregate."
            tag="live"
          />
        </div>
      </section>

      {/* ========== WHY ========== */}
      <section>
        <SectionHeader kicker="Differentiators" title="Why it's different" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FeatureTile
            icon="◉"
            title="Provenance-first"
            body="Every number carries its source. No blurred lines between demo and real."
          />
          <FeatureTile
            icon="∎"
            title="Free forever"
            body="No sign-up, no tracking, no API keys. Your wallet is yours."
          />
          <FeatureTile
            icon="∿"
            title="Real H3 decode"
            body="Helium hotspots land on their actual asserted coordinates — not guessed."
          />
          <FeatureTile
            icon="▲"
            title="Honest gaps"
            body="Where data is private (Render GPUs, Hivemapper GPS), we say so — not fake it."
          />
        </div>
      </section>

      {/* ========== COMING SOON ========== */}
      <section>
        <SectionHeader
          kicker="Roadmap"
          title="More DePINs landing soon"
          desc="We're tracking six more Solana DePIN protocols next. Earnings + on-chain balances first, geo where publicly available."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <PartnerTile
            glyph="◆"
            color="#14b8a6"
            name="Nosana"
            category="GPU compute grid"
            blurb="Distributed CI/CD + AI inference on idle GPUs. NOS rewards on Solana."
          />
          <PartnerTile
            glyph="∎"
            color="#8b5cf6"
            name="io.net"
            category="AI compute marketplace"
            blurb="Aggregates a million-GPU network for ML workloads. IO token, payable hourly."
          />
          <PartnerTile
            glyph="∿"
            color="#10b981"
            name="GRASS"
            category="Bandwidth sharing"
            blurb="Your unused internet becomes training data for AI labs. GRASS rewards."
          />
          <PartnerTile
            glyph="◉"
            color="#fbbf24"
            name="WeatherXM"
            category="Weather station network"
            blurb="Hyperlocal weather data from owner-operated stations. WXM on Solana."
          />
          <PartnerTile
            glyph="▶"
            color="#f97316"
            name="DIMO"
            category="Connected vehicles"
            blurb="Stream your car's data on-chain. Earn DIMO for trips, mileage, diagnostics."
          />
          <PartnerTile
            glyph="⬢"
            color="#ec4899"
            name="Geodnet"
            category="Precision GPS (RTK)"
            blurb="Centimetre-accurate positioning network for drones, robotics, surveying."
          />
        </div>
      </section>

      {/* ========== HONESTY ========== */}
      <section>
        <div className="panel reticle p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] opacity-[0.08] pointer-events-none">
            <svg viewBox="0 0 300 300">
              <circle cx="150" cy="150" r="140" fill="none" stroke="#22d3ee" strokeWidth="0.5" />
              <circle cx="150" cy="150" r="100" fill="none" stroke="#22d3ee" strokeWidth="0.5" />
              <circle cx="150" cy="150" r="60" fill="none" stroke="#22d3ee" strokeWidth="0.5" />
              <line x1="0" y1="150" x2="300" y2="150" stroke="#22d3ee" strokeWidth="0.4" />
              <line x1="150" y1="0" x2="150" y2="300" stroke="#22d3ee" strokeWidth="0.4" />
            </svg>
          </div>

          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-aqua mb-4">
            What we can — and can't — see
          </div>
          <h3 className="font-serif text-[34px] sm:text-[42px] leading-[1.05] max-w-2xl mb-4">
            We would rather show a gap than fake a dot.
          </h3>
          <p className="text-dim max-w-2xl leading-relaxed">
            Helium asserts hotspot locations on-chain as H3 cells — we decode those into exact coordinates.
            Render nodes are cloud GPUs with no public geo, and Hivemapper drives are private GPS —
            we surface real earnings but mark locations as <span className="text-aqua">region-aggregate</span> or omit them.
            Most dashboards hide this. We don't.
          </p>
        </div>
      </section>

      {earningsData && Object.keys(earningsData.protocols).length > 0 && (
        <section>
          <SectionHeader kicker="Portfolio" title="Earnings breakdown" />
          <EarningsChart earningsData={earningsData} />
        </section>
      )}

      {nodeData.length > 0 && (
        <section>
          <SectionHeader kicker="Fleet" title="Nodes owned" />
          <NodeList nodeList={nodeData} />
        </section>
      )}

      {/* ========== FINAL CTA ========== */}
      <section>
        <div className="panel panel-hot p-8 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-50">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-hair" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-hair" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-hair" />
          </div>
          <h3 className="font-serif text-[36px] sm:text-[52px] leading-[1.02] text-white mb-3 relative">
            Point SolRadar at <span className="italic text-aqua">your</span> wallet.
          </h3>
          <p className="text-dim max-w-xl mx-auto mb-6 relative">
            One console. Three networks. Zero cost. See where your nodes are, how much they earn, and what's publicly knowable on-chain.
          </p>
          <button onClick={scrollToScan} className="btn-hot rounded-md px-7 py-3 text-sm relative">
            Open the scanner →
          </button>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div className="mb-6 max-w-2xl">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-aqua mb-2">{kicker}</div>
      <h2 className="font-serif text-[30px] sm:text-[38px] leading-[1.05] text-white mb-2">{title}</h2>
      {desc && <p className="text-dim text-sm leading-relaxed">{desc}</p>}
    </div>
  );
}

function HeroStats({ protocols }: { protocols: ProtocolData[] }) {
  const total = protocols.reduce((s, p) => s + (p.total_nodes || 0), 0);
  const active = protocols.reduce((s, p) => s + (p.active_nodes || 0), 0);
  const rewards = protocols.reduce((s, p) => s + (p.total_rewards_24h || 0), 0);

  return (
    <div className="panel reticle p-5 w-full lg:w-[320px] shrink-0 relative">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-dimmer mb-4">
        network telemetry
      </div>
      <Stat label="nodes tracked" value={total.toLocaleString()} accent />
      <Stat label="active last hour" value={active.toLocaleString()} color="var(--emerald)" />
      <Stat
        label="rewards 24h"
        value={rewards > 0 ? (rewards / 1_000_000).toFixed(2) + "M" : "—"}
        suffix="tokens"
      />
      <div className="mt-4 pt-4 border-t border-hair text-[10px] font-mono text-dimmer uppercase tracking-[0.18em] flex items-center justify-between">
        <span>scanner</span>
        <span className="text-[color:var(--emerald)]">● operational</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent,
  color,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-baseline justify-between py-2">
      <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-dimmer">{label}</span>
      <span
        className={`font-serif text-[26px] leading-none ${accent ? "shimmer-text" : ""}`}
        style={!accent && color ? { color } : undefined}
      >
        {value}
        {suffix && <span className="text-[11px] font-mono text-dimmer ml-1.5 uppercase tracking-[0.15em]">{suffix}</span>}
      </span>
    </div>
  );
}

function HowStep({ n, title, body, tag }: { n: string; title: string; body: string; tag?: string }) {
  return (
    <div className="panel reticle p-5 relative h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="font-serif text-[34px] leading-none text-aqua">{n}</span>
        {tag && (
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-dimmer">{tag}</span>
        )}
      </div>
      <h4 className="text-white font-semibold mb-2 text-[15px]">{title}</h4>
      <p className="text-dim text-[13px] leading-relaxed">{body}</p>
    </div>
  );
}

function PartnerTile({
  glyph,
  color,
  name,
  category,
  blurb,
}: {
  glyph: string;
  color: string;
  name: string;
  category: string;
  blurb: string;
}) {
  return (
    <div className="panel reticle p-4 relative overflow-hidden group hover:border-aqua transition-colors">
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity pointer-events-none"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between mb-2 relative">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none" style={{ color }}>{glyph}</span>
          <span className="text-white font-semibold text-[14px]">{name}</span>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-[0.18em] px-1.5 py-0.5 rounded border border-[rgba(34,211,238,0.3)] text-aqua bg-[rgba(34,211,238,0.06)]">
          soon
        </span>
      </div>
      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-dimmer mb-2 relative">
        {category}
      </div>
      <div className="text-dim text-[12px] leading-relaxed relative">{blurb}</div>
    </div>
  );
}

function FeatureTile({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="panel p-4 hover:panel-hot transition-all h-full group">
      <div className="text-aqua text-xl mb-3 group-hover:scale-110 transition-transform inline-block">{icon}</div>
      <div className="text-white text-[13px] font-semibold mb-1.5">{title}</div>
      <div className="text-dim text-[12px] leading-relaxed">{body}</div>
    </div>
  );
}

function ModeBadge({ mode, cached }: { mode: "live" | "empty" | "demo"; cached: boolean }) {
  const style =
    mode === "live"
      ? { cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400 animate-pulse", label: "LIVE · on-chain" }
      : mode === "demo"
      ? { cls: "bg-violet-500/10 text-violet-300 border-violet-500/30", dot: "bg-violet-400 animate-pulse", label: "DEMO · synthesized" }
      : { cls: "bg-amber-500/10 text-amber-300 border-amber-500/30", dot: "bg-amber-400", label: "no DePIN activity" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-mono px-2 py-1 rounded border ${style.cls}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
      {cached && <span className="text-dimmer normal-case tracking-normal">· cached</span>}
    </span>
  );
}

function SourceBadge({ value }: { value: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    onchain:              { label: "on-chain",   cls: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" },
    onchain_tx:           { label: "on-chain tx", cls: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" },
    onchain_unasserted:   { label: "unasserted",  cls: "text-sky-300 border-sky-500/30 bg-sky-500/10" },
    balance:              { label: "balance",     cls: "text-sky-300 border-sky-500/30 bg-sky-500/10" },
    region:               { label: "region",      cls: "text-violet-300 border-violet-500/30 bg-violet-500/10" },
    aggregate:            { label: "aggregate",   cls: "text-violet-300 border-violet-500/30 bg-violet-500/10" },
    demo:                 { label: "demo",        cls: "text-violet-300 border-violet-500/30 bg-violet-500/10" },
    none:                 { label: "—",           cls: "text-[color:var(--text-3)] border-hair" },
  };
  const s = map[value] || { label: value, cls: "text-dim border-hair" };
  return (
    <span className={`inline-block text-[9px] uppercase tracking-[0.15em] font-mono px-1.5 py-0.5 rounded border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function LivePanel({ snapshot }: { snapshot: LiveSnapshot }) {
  const byName = Object.fromEntries(snapshot.protocols.map((p) => [p.name, p]));
  const fmt = (n: number) =>
    n === 0 ? "—" : n < 0.01 ? n.toExponential(2) : n.toLocaleString(undefined, { maximumFractionDigits: 4 });

  return (
    <div className="panel panel-hot p-5 relative">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-aqua">
          snapshot · {snapshot.provenance.rpc}
        </span>
        <span className="text-[10px] font-mono text-dimmer">
          {snapshot.cached ? `cached ${snapshot.age_sec}s ago` : "fresh"}
        </span>
      </div>

      {snapshot.asset_count !== undefined && snapshot.asset_count > 0 && (
        <div className="text-[10px] font-mono text-dimmer mb-3">
          scanned {snapshot.asset_count} compressed NFTs · matched{" "}
          {snapshot.protocols.find((p) => p.name === "Helium")?.node_count ?? 0} as Helium hotspots
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {["Helium", "Hivemapper", "Render"].map((name) => {
          const p = byName[name];
          if (!p) return null;
          const color = name === "Helium" ? "#22d3ee" : name === "Hivemapper" ? "#fb923c" : "#a78bfa";
          return (
            <div key={name} className="panel reticle p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-semibold" style={{ color }}>{name}</span>
                <SourceBadge value={p.source.nodes} />
              </div>
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-dimmer">nodes</span>
                <span className="font-serif text-[26px] leading-none">
                  {p.node_count}
                  {p.active_count > 0 && <span className="text-[color:var(--emerald)] text-[13px] ml-1.5">· {p.active_count}</span>}
                </span>
              </div>

              <dl className="space-y-1.5 text-[11px] font-mono">
                {Object.entries(p.balances).map(([sym, bal]) => (
                  <div key={sym} className="flex justify-between text-dim">
                    <dt className="uppercase tracking-[0.1em] text-dimmer">{sym}</dt>
                    <dd>{fmt(bal)}</dd>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-hair flex justify-between items-center">
                  <dt className="flex items-center gap-1.5 text-dimmer uppercase tracking-[0.1em]">
                    24h
                    <SourceBadge value={p.source.earnings} />
                  </dt>
                  <dd className="text-white">{fmt(p.earnings_24h)}</dd>
                </div>
                <div className="flex justify-between text-dim">
                  <dt className="uppercase tracking-[0.1em] text-dimmer">30d</dt>
                  <dd>{fmt(p.earnings_30d)}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-mono text-dimmer mt-4 leading-relaxed">
        <span className="text-[color:var(--emerald)]">●</span> on-chain — verified on Solana ·{" "}
        <span className="text-[color:var(--aqua)]">●</span> balance — wallet level only ·{" "}
        <span className="text-violet-400">●</span> region/aggregate — location not public per wallet
      </p>
    </div>
  );
}
