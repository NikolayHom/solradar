"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UserEarnings {
  wallet: string;
  total_earnings_24h: number;
  total_earnings_30d: number;
  protocols: Record<
    string,
    { earnings_24h: number; earnings_30d: number; node_count: number }
  >;
}

const PROTOCOL_BAR_COLORS: Record<string, string> = {
  Helium: "#22d3ee",
  Hivemapper: "#fb923c",
  Render: "#a78bfa",
};
const FALLBACK_BAR = "#34d399";

export function EarningsChart({ earningsData }: { earningsData: UserEarnings }) {
  const chartEntries = Object.entries(earningsData.protocols).map(
    ([protocolName, protocolStats]) => ({
      name: protocolName,
      "24h": protocolStats.earnings_24h,
      "30d": protocolStats.earnings_30d,
      nodes: protocolStats.node_count,
      fill: PROTOCOL_BAR_COLORS[protocolName] ?? FALLBACK_BAR,
    })
  );

  return (
    <div className="border border-[#2a2a38] rounded-lg bg-[#111118] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#9898a8]">
          Earnings by Protocol
        </h3>
        <div className="text-right">
          <p className="text-xs text-[#5a5a6e]">total 30d</p>
          <p className="text-sm font-semibold text-white">
            ${(earningsData.total_earnings_30d ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {chartEntries.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartEntries} barCategoryGap="20%">
            <XAxis
              dataKey="name"
              tick={{ fill: "#5a5a6e", fontSize: 11 }}
              axisLine={{ stroke: "#2a2a38" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#5a5a6e", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a24",
                border: "1px solid #2a2a38",
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: "#e8e8f0" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#9898a8" }}
            />
            <Bar dataKey="24h" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="30d" fill="#22c55e" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-[#5a5a6e] text-sm">
          no earnings data
        </div>
      )}
    </div>
  );
}
