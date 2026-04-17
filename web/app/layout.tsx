import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { LiveTicker } from "@/components/LiveTicker";

export const metadata: Metadata = {
  title: "SolRadar — DePIN Fleet Telemetry",
  description:
    "Real on-chain telemetry for your Solana DePIN fleet. Helium, Hivemapper, Render — one radar. Free forever.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="fixed inset-0 -z-10 deck-grid opacity-[0.35] pointer-events-none" />
        <SiteHeader />
        <LiveTicker />
        <main className="max-w-[1180px] mx-auto px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-hair mt-24 py-10 px-6">
          <div className="max-w-[1180px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-dimmer font-mono">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--emerald)] blink" />
              <span>100% free · no sign-up · no tracking · no API keys</span>
            </div>
            <div className="flex items-center gap-4">
              <span>solradar // DePIN fleet telemetry</span>
              <span className="text-aqua">v0.2</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
