"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

// Tableau Superstore palette — restrained, two-tone with a single accent.
// Primary blue + muted gray-blue. Avoids rainbow chart syndrome.
const CHART_PRIMARY = "#3b82f6";
const CHART_MUTED = "#64748b";

export function Sparkline({
  data,
  dataKey = "value",
  color = CHART_PRIMARY,
}: {
  data: { value: number }[];
  dataKey?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniLine({
  data,
  dataKey = "value",
  color = CHART_PRIMARY,
}: {
  data: { value: number }[];
  dataKey?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export interface FunnelDatum {
  stage: string;
  count: number;
  pct: number; // % of stage 1
}

export function FunnelBars({ data }: { data: FunnelDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 56, left: 92, bottom: 8 }}
        barCategoryGap={6}
      >
        <XAxis type="number" hide domain={[0, max]} />
        <YAxis
          type="category"
          dataKey="stage"
          axisLine={false}
          tickLine={false}
          width={92}
          tick={{ fontSize: 12, fill: "currentColor" }}
          className="text-muted-foreground"
        />
        <Tooltip
          cursor={{ fill: "rgba(100,116,139,0.08)" }}
          contentStyle={{
            backgroundColor: "var(--popover, #1e293b)",
            border: "1px solid var(--border, #334155)",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          formatter={(value) => [value ?? 0, "count"]}
        />
        <Bar
          dataKey="count"
          radius={[2, 2, 2, 2]}
          isAnimationActive={false}
          label={{
            position: "right",
            formatter: (v: unknown) =>
              typeof v === "number" ? v.toLocaleString() : String(v ?? ""),
            fontSize: 11,
            fill: "currentColor",
            className: "fill-foreground",
          }}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={i === 0 ? CHART_PRIMARY : CHART_MUTED}
              fillOpacity={1 - i * 0.1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
