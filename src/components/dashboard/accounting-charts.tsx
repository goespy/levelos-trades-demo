"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Tableau Superstore palette — restrained, semantic.
const COLOR_REVENUE = "#16a34a"; // green-600
const COLOR_COSTS = "#ef4444"; // red-500
const COLOR_PROFIT = "#3b82f6"; // blue-500
const COLOR_GRID = "rgba(100,116,139,0.15)";

// Distinct category colors — kept muted for Tableau feel.
export const CATEGORY_COLORS: Record<string, string> = {
  MATERIAL: "#3b82f6", // blue
  LABOR: "#a855f7", // purple
  SUBCONTRACTOR: "#f97316", // orange
  PERMIT: "#eab308", // yellow
  EQUIPMENT: "#06b6d4", // cyan
  OTHER: "#94a3b8", // slate
};

const tooltipStyle = {
  backgroundColor: "var(--popover, #0f172a)",
  border: "1px solid var(--border, #334155)",
  borderRadius: "6px",
  fontSize: "12px",
  padding: "6px 10px",
};

const usd0 = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

// ---- Hero KPI sparkline -----------------------------------------------------
export function KpiSpark({
  data,
  color = COLOR_PROFIT,
}: {
  data: { value: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={32}>
      <ComposedChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace("#", "")})`}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---- Tiny inline category bars (used in KPI tile) ---------------------------
export function CategoryMiniBars({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1 h-7">
      {data.map((d) => (
        <div
          key={d.name}
          className="flex-1 rounded-sm"
          title={`${d.name}: ${usd0(d.value)}`}
          style={{
            backgroundColor: d.color,
            height: `${Math.max(8, (d.value / max) * 100)}%`,
            opacity: d.value === 0 ? 0.15 : 1,
          }}
        />
      ))}
    </div>
  );
}

// ---- Revenue vs Costs (composed: bars + line) -------------------------------
export interface MonthlyDatum {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
}

export function RevenueVsCosts({ data }: { data: MonthlyDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
        barCategoryGap="20%"
      >
        <CartesianGrid stroke={COLOR_GRID} vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-muted-foreground"
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "currentColor" }}
          className="text-muted-foreground"
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
          width={42}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "rgba(100,116,139,0.06)" }}
          formatter={(value, name) => {
            const v = typeof value === "number" ? value : 0;
            const n = typeof name === "string" ? name : "";
            return [usd0(v), n.charAt(0).toUpperCase() + n.slice(1)];
          }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
        />
        <Bar
          dataKey="revenue"
          fill={COLOR_REVENUE}
          radius={[3, 3, 0, 0]}
          name="Revenue"
          isAnimationActive={false}
        />
        <Bar
          dataKey="costs"
          fill={COLOR_COSTS}
          radius={[3, 3, 0, 0]}
          name="Costs"
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke={COLOR_PROFIT}
          strokeWidth={2}
          dot={{ r: 3, fill: COLOR_PROFIT, strokeWidth: 0 }}
          name="Profit"
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ---- Cost Breakdown Donut ---------------------------------------------------
export interface CategoryDatum {
  name: string;
  label: string;
  value: number;
}

export function CostDonut({ data }: { data: CategoryDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, _name, p) => {
              const v = typeof value === "number" ? value : 0;
              return [
                `${usd0(v)} (${total > 0 ? ((v / total) * 100).toFixed(0) : 0}%)`,
                p?.payload?.label ?? "",
              ];
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={2}
            isAnimationActive={false}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={CATEGORY_COLORS[d.name] || "#94a3b8"} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Total
        </span>
        <span className="text-xl font-bold tabular-nums">{usd0(total)}</span>
      </div>
    </div>
  );
}

// ---- Mini per-job progress bar (spent vs budget) ----------------------------
export function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  if (budget <= 0) {
    return <div className="h-1.5 rounded-full bg-muted" />;
  }
  const pct = Math.min(100, (spent / budget) * 100);
  const over = spent > budget;
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full ${
          over
            ? "bg-red-500"
            : pct > 85
              ? "bg-yellow-500"
              : "bg-blue-500"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
