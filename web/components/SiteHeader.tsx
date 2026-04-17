"use client";

import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[rgba(5,7,15,0.72)] border-b border-hair">
      <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <RadarLogo />
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-semibold tracking-tight text-white">
              sol<span className="text-aqua">radar</span>
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-dimmer uppercase tracking-[0.2em]">
              DePIN telemetry
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-[13px]">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md text-dim hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--aqua)] transition-colors"
          >
            Radar
          </Link>
          <Link
            href="/nodes"
            className="px-3 py-1.5 rounded-md text-dim hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--aqua)] transition-colors"
          >
            Fleet
          </Link>
          <a
            href="#how"
            className="px-3 py-1.5 rounded-md text-dim hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--aqua)] transition-colors hidden sm:block"
          >
            How it works
          </a>
          <a
            href="#scan"
            className="ml-2 btn-hot text-[12px] px-3.5 py-1.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--ink)] focus-visible:ring-[color:var(--aqua)]"
          >
            Scan wallet →
          </a>
        </nav>
      </div>
    </header>
  );
}

function RadarLogo() {
  return (
    <span className="relative inline-block w-8 h-8">
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <defs>
          <radialGradient id="radar-fill" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="radar-sweep-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#radar-fill)" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="1" />
        <circle cx="16" cy="16" r="9" fill="none" stroke="#22d3ee" strokeOpacity="0.25" strokeWidth="0.8" />
        <circle cx="16" cy="16" r="4" fill="none" stroke="#22d3ee" strokeOpacity="0.2" strokeWidth="0.8" />
        <g className="radar-sweep">
          <path d="M16 16 L30 16 A14 14 0 0 0 16 2 Z" fill="url(#radar-sweep-grad)" opacity="0.55" />
        </g>
        <circle cx="16" cy="16" r="1.3" fill="#22d3ee" />
      </svg>
    </span>
  );
}
