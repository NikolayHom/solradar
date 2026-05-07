"use client";

const SIGNALS = [
  "▲ helium · 8,412 hotspots pinged",
  "● hivemapper · 128k km mapped today",
  "◆ render · 2,318 GPU jobs queued",
  "⟟ H3 res-12 cells decoded on-chain",
  "∿ 342 HNT flowing last hour",
  "◉ provenance-first · every data point tagged",
  "▢ free · no sign-up · no API keys",
  "▲ helium mobile · 1.1M MOBILE distributed /d",
  "◆ render · 14% RNDR burn rate",
  "● hivemapper · HONEY rewards live",
];

export function LiveTicker() {
  const line = [...SIGNALS, ...SIGNALS]; // doubled for seamless marquee
  return (
    <div className="border-b border-hair bg-[rgba(10,15,28,0.6)] overflow-hidden">
      <div className="max-w-none">
        <div className="ticker-track py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-dim">
          {line.map((s, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-aqua">{s.slice(0, 1)}</span>
              <span>{s.slice(2)}</span>
              <span className="text-dimmer">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
