import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { COST_CATEGORIES, COST_CATEGORY_LABELS } from "@/lib/constants";
import {
  AlertTriangle,
  TrendingUp,
  Wallet,
  Receipt,
  Percent,
  ChevronRight,
} from "lucide-react";
import {
  KpiSpark,
  CategoryMiniBars,
  RevenueVsCosts,
  CostDonut,
  BudgetBar,
  CATEGORY_COLORS,
  type MonthlyDatum,
  type CategoryDatum,
} from "@/components/dashboard/accounting-charts";

export const dynamic = "force-dynamic";

function fmt0(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function pct1(v: number) {
  return `${v.toFixed(1)}%`;
}

// Build last-N-month "YYYY-MM" buckets newest-last for time-series.
function lastMonths(n: number): { key: string; label: string; date: Date }[] {
  const now = new Date();
  const out: { key: string; label: string; date: Date }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    out.push({ key, label, date: d });
  }
  return out;
}

function ymKey(d: Date | null | undefined) {
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const STATUS_RANK: Record<string, number> = {
  ACTIVE: 0,
  ON_HOLD: 1,
  COMPLETE: 2,
  CANCELLED: 3,
};

export default async function AccountingPage() {
  const [invoices, costEntries, jobs, builds, clients] = await Promise.all([
    prisma.invoice.findMany(),
    prisma.jobCostEntry.findMany(),
    prisma.job.findMany({
      where: { status: { in: ["ACTIVE", "ON_HOLD", "COMPLETE"] } },
    }),
    prisma.poolBuild.findMany(),
    prisma.client.findMany({ select: { id: true, name: true } }),
  ]);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  // -------- KPI calculations -------------------------------------------------
  // Year-to-date — current calendar year.
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const ytdInvoices = invoices.filter(
    (i) => i.paidAt && new Date(i.paidAt) >= yearStart
  );
  const revenueYTD = ytdInvoices.reduce(
    (s, i) => s + (i.paidAmount ?? i.amount),
    0
  );

  const outstandingInvoices = invoices.filter(
    (i) => i.status === "SENT" || i.status === "OVERDUE"
  );
  const outstandingTotal = outstandingInvoices.reduce(
    (s, i) => s + (i.amount - (i.paidAmount ?? 0)),
    0
  );
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;

  const ytdCosts = costEntries.filter((c) => new Date(c.date) >= yearStart);
  const totalCostsYTD = ytdCosts.reduce((s, c) => s + c.amount, 0);

  // Average margin across COMPLETE jobs
  const completeJobs = jobs.filter((j) => j.status === "COMPLETE");
  const completeMargins = completeJobs
    .map((j) => {
      const build =
        builds.find((b) => b.clientId === j.clientId && b.name === j.name) ||
        builds.find((b) => b.clientId === j.clientId);
      const sale = build?.salePrice || 0;
      const spent = costEntries
        .filter((c) => c.jobId === j.id)
        .reduce((s, c) => s + c.amount, 0);
      if (sale <= 0) return null;
      return ((sale - spent) / sale) * 100;
    })
    .filter((v): v is number => v !== null);
  const avgMargin =
    completeMargins.length > 0
      ? completeMargins.reduce((s, m) => s + m, 0) / completeMargins.length
      : 0;
  const marginColor =
    avgMargin >= 28
      ? "text-green-500"
      : avgMargin >= 20
        ? "text-yellow-500"
        : "text-red-500";

  // -------- Monthly time-series (last 6 months) ------------------------------
  const months6 = lastMonths(6);
  const months6Map = new Map(months6.map((m) => [m.key, { revenue: 0, costs: 0 }]));
  for (const inv of invoices) {
    if (!inv.paidAt) continue;
    const k = ymKey(new Date(inv.paidAt));
    if (k && months6Map.has(k)) {
      months6Map.get(k)!.revenue += inv.paidAmount ?? inv.amount;
    }
  }
  for (const c of costEntries) {
    const k = ymKey(new Date(c.date));
    if (k && months6Map.has(k)) {
      months6Map.get(k)!.costs += c.amount;
    }
  }
  const monthlyData: MonthlyDatum[] = months6.map((m) => {
    const row = months6Map.get(m.key)!;
    return {
      month: m.label,
      revenue: Math.round(row.revenue),
      costs: Math.round(row.costs),
      profit: Math.round(row.revenue - row.costs),
    };
  });

  // Sparkline data (revenue per month)
  const revenueSpark = monthlyData.map((m) => ({ value: m.revenue }));

  // -------- Cost breakdown by category ---------------------------------------
  const byCat: Record<string, number> = Object.fromEntries(
    COST_CATEGORIES.map((c) => [c, 0])
  );
  for (const c of costEntries) {
    byCat[c.category] = (byCat[c.category] || 0) + c.amount;
  }
  const categoryData: CategoryDatum[] = COST_CATEGORIES.map((c) => ({
    name: c,
    label: COST_CATEGORY_LABELS[c],
    value: Math.round(byCat[c] || 0),
  })).filter((d) => d.value > 0);

  const miniBarData = COST_CATEGORIES.map((c) => ({
    name: c,
    value: byCat[c] || 0,
    color: CATEGORY_COLORS[c],
  }));

  // -------- Per-job P&L ------------------------------------------------------
  const buildByJob = (jobName: string, clientId: string) =>
    builds.find((b) => b.clientId === clientId && b.name === jobName) ||
    builds.find((b) => b.clientId === clientId) ||
    null;

  const perJob = jobs
    .map((j) => {
      const jobInvoices = invoices.filter((i) => i.jobId === j.id);
      const jobCosts = costEntries.filter((c) => c.jobId === j.id);
      const invoicedTotal = jobInvoices.reduce((s, i) => s + i.amount, 0);
      const collected = jobInvoices
        .filter((i) => i.status === "PAID")
        .reduce((s, i) => s + (i.paidAmount ?? i.amount), 0);
      const spent = jobCosts.reduce((s, c) => s + c.amount, 0);
      const build = buildByJob(j.name, j.clientId);
      const salePrice = build?.salePrice || invoicedTotal;
      const totalCOGS = build?.totalCOGS || 0;
      const profit = collected - spent;
      const margin = salePrice > 0 ? ((salePrice - spent) / salePrice) * 100 : 0;
      return {
        job: j,
        clientName: clientMap[j.clientId] || "Unknown",
        salePrice,
        invoicedTotal,
        collected,
        spent,
        profit,
        margin,
        totalCOGS,
      };
    })
    .sort(
      (a, b) =>
        (STATUS_RANK[a.job.status] ?? 9) - (STATUS_RANK[b.job.status] ?? 9) ||
        b.salePrice - a.salePrice
    )
    .slice(0, 7);

  // -------- Aging Receivables (oldest 3) -------------------------------------
  const nowMs = new Date().getTime();
  const overdueInvoices = invoices
    .filter((i) => i.status === "OVERDUE")
    .map((i) => {
      const due = i.dueDate ? new Date(i.dueDate) : null;
      const daysOverdue = due
        ? Math.floor((nowMs - due.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return { invoice: i, daysOverdue };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
  const overdueTotal = overdueInvoices.reduce(
    (s, x) => s + (x.invoice.amount - (x.invoice.paidAmount ?? 0)),
    0
  );
  const oldestOverdue = overdueInvoices.slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Accounting"
        description="Revenue, costs, and per-job P&L"
      />

      {/* Hero KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Revenue Collected YTD */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" />
            <span className="text-[11px] uppercase tracking-wide">
              Revenue Collected
            </span>
          </div>
          <p className="text-3xl font-bold mt-1.5 tabular-nums">
            {fmt0(revenueYTD)}
          </p>
          <p className="text-[11px] text-muted-foreground">YTD &middot; paid invoices</p>
          <div className="mt-2 -mx-1">
            <KpiSpark data={revenueSpark} color="#16a34a" />
          </div>
        </div>

        {/* Outstanding */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Receipt className="h-3.5 w-3.5" />
            <span className="text-[11px] uppercase tracking-wide">
              Outstanding
            </span>
          </div>
          <p className="text-3xl font-bold mt-1.5 tabular-nums">
            {fmt0(outstandingTotal)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {outstandingInvoices.length} unpaid invoice
            {outstandingInvoices.length === 1 ? "" : "s"}
          </p>
          <div className="mt-2 h-7 flex items-center">
            {overdueCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                {overdueCount} overdue
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">All current</span>
            )}
          </div>
        </div>

        {/* Total Costs YTD */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[11px] uppercase tracking-wide">
              Total Costs
            </span>
          </div>
          <p className="text-3xl font-bold mt-1.5 tabular-nums">
            {fmt0(totalCostsYTD)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            YTD &middot; {ytdCosts.length} entries
          </p>
          <div className="mt-2">
            <CategoryMiniBars data={miniBarData} />
          </div>
        </div>

        {/* Avg Margin */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Percent className="h-3.5 w-3.5" />
            <span className="text-[11px] uppercase tracking-wide">
              Avg Margin
            </span>
          </div>
          <p className={`text-3xl font-bold mt-1.5 tabular-nums ${marginColor}`}>
            {completeMargins.length > 0 ? pct1(avgMargin) : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {completeJobs.length} completed job
            {completeJobs.length === 1 ? "" : "s"}
          </p>
          <div className="mt-2 h-7 flex items-end gap-1">
            <span className="text-[10px] text-muted-foreground">
              Target 28%
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden self-center">
              <div
                className={`h-full ${
                  avgMargin >= 28
                    ? "bg-green-500"
                    : avgMargin >= 20
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, (avgMargin / 40) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Two-column charts row */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Revenue vs Costs */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue vs Costs</CardTitle>
            <p className="text-xs text-muted-foreground">
              Last 6 months &middot; profit shown as line
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <RevenueVsCosts data={monthlyData} />
          </CardContent>
        </Card>

        {/* Cost Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cost Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">All-time by category</p>
          </CardHeader>
          <CardContent className="pt-0">
            {categoryData.length > 0 ? (
              <>
                <CostDonut data={categoryData} />
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {categoryData.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-2 text-xs min-w-0"
                    >
                      <span
                        className="h-2 w-2 rounded-sm shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[c.name] }}
                      />
                      <span className="text-muted-foreground truncate">
                        {c.label}
                      </span>
                      <span className="ml-auto tabular-nums font-medium">
                        {fmt0(c.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">
                No cost entries yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-job P&L table */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Per-Job P&amp;L</CardTitle>
          <p className="text-xs text-muted-foreground">
            Active jobs first &middot; collected vs spent &middot; budget tracking
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {perJob.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No active jobs
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Invoiced</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="min-w-[120px]">Budget Used</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perJob.map((row) => {
                  const marginCls =
                    row.margin >= 28
                      ? "text-green-500"
                      : row.margin >= 20
                        ? "text-yellow-500"
                        : "text-red-500";
                  const usedPct =
                    row.totalCOGS > 0 ? (row.spent / row.totalCOGS) * 100 : 0;
                  return (
                    <TableRow
                      key={row.job.id}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <Link
                          href={`/accounting/${row.job.id}`}
                          className="block"
                        >
                          <div className="font-medium">{row.job.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.clientName}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            row.job.status === "ACTIVE"
                              ? "bg-blue-500/15 text-blue-400"
                              : row.job.status === "ON_HOLD"
                                ? "bg-yellow-500/15 text-yellow-400"
                                : "bg-green-500/15 text-green-400"
                          }
                        >
                          {row.job.status === "ON_HOLD"
                            ? "On Hold"
                            : row.job.status === "ACTIVE"
                              ? "Active"
                              : "Complete"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmt0(row.salePrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {fmt0(row.invoicedTotal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmt0(row.collected)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {fmt0(row.spent)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-semibold ${
                          row.profit >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {fmt0(row.profit)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-medium ${marginCls}`}
                      >
                        {row.salePrice > 0 ? pct1(row.margin) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[100px]">
                          <BudgetBar
                            spent={row.spent}
                            budget={row.totalCOGS}
                          />
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
                            <span>{row.totalCOGS > 0 ? `${usedPct.toFixed(0)}%` : "—"}</span>
                            <span>
                              {row.totalCOGS > 0 ? fmt0(row.totalCOGS) : ""}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/accounting/${row.job.id}`}>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Aging Receivables */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {overdueInvoices.length > 0 && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                Aging Receivables
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Invoices past due
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-red-500">
                {fmt0(overdueTotal)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {overdueInvoices.length} overdue
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {oldestOverdue.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No overdue invoices. Nice work.
            </p>
          ) : (
            <div className="space-y-1">
              {oldestOverdue.map(({ invoice, daysOverdue }) => {
                const job = jobs.find((j) => j.id === invoice.jobId);
                const clientName = job
                  ? clientMap[job.clientId] || "Unknown"
                  : "Unknown";
                const owed = invoice.amount - (invoice.paidAmount ?? 0);
                return (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-2 -mx-2 rounded hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {clientName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {invoice.number} &middot; {invoice.phaseLabel}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <Badge
                        variant="secondary"
                        className="bg-red-500/15 text-red-400"
                      >
                        {daysOverdue}d late
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums w-24 text-right">
                        {fmt0(owed)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
