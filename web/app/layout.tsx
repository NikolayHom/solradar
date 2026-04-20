import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolRadar — DePIN Analytics",
  description: "Unified analytics for Solana DePIN networks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f]">
        <header className="border-b border-[#2a2a38] bg-[#111118] px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h1 className="text-lg font-semibold text-white tracking-tight">
                SolRadar
              </h1>
              <span className="text-xs text-[#5a5a6e] ml-1">DePIN Analytics</span>
            </div>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="text-[#9898a8] hover:text-white transition-colors">
                Dashboard
              </a>
              <a href="/nodes" className="text-[#9898a8] hover:text-white transition-colors">
                Nodes
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
