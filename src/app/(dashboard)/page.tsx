import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Sparkline, FunnelBars, type FunnelDatum } from "@/components/dashboard/charts";
import Link from "next/link";
import {
  HardHat,
  TrendingUp,
  DollarSign,
  Target,
  ChevronUp,
  ChevronDown,
  Minus,
  ChevronRight,
  FileSignature,
  FileText,
  Receipt,
  CheckCircle2,
  CalendarClock,
  Plus,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usdK = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return usd.format(v);
};

function pct(v: number, digits = 0) {
  return `${v.toFixed(digits)}%`;
}

function relativeTime(d: Date | string | null): string {
  if (!d) return "";
  const now = Date.now();
  const t = new Date(d).getTime();
  const diffMs = now - t;
  const min = Math.floor(diffMs / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

interface KpiTileProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  delta?: { value: number; suffix?: string; positiveIsGood?: boolean } | null;
  context?: string;
  spark?: { value: number }[];
  sparkColor?: string;
}

function KpiTile({
  label,
  value,
  icon: Icon,
  delta,
  context,
  spark,
  sparkColor,
}: KpiTileProps) {
  const positiveIsGood = delta?.positiveIsGood ?? true;
  const dirUp = delta && delta.value > 0;
  const dirDown = delta && delta.value < 0;
  const isGood = (dirUp && positiveIsGood) || (dirDown && !positiveIsGood);
  const isBad = (dirDown && positiveIsGood) || (dirUp && !positiveIsGood);
  const trendColor = isGood ? "text-green-500" : isBad ? "text-red-500" : "text-muted-foreground";
  const TrendIcon = dirUp ? ChevronUp : dirDown ? ChevronDown : Minus;

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums leading-none">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta && (
          <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(delta.value).toFixed(0)}
            {delta.suffix ?? "%"}
          </span>
        )}
        {context && <span className="text-muted-foreground truncate">{context}</span>}
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-2 -mx-1">
          <Sparkline data={spark} color={sparkColor} />
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  // Reference dates
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Single fan-out — minimize round-trips
  const [
    weeklyMetrics,
    jobs,
    poolBuilds,
    proposals,
    contracts,
    invoicesAll,
    invoicesPaidYTD,
    invoicesPaidThisMonth,
    invoicesPaidLastMonth,
    clientsRecent,
    clientsQualified,
    designProjects,
    activeJobsRich,
    maintenancePlans,
  ] = await Promise.all([
    prisma.weeklyMetric.findMany({
      orderBy: { weekStartDate: "desc" },
      take: 8,
    }),
    prisma.job.findMany({ select: { id: true, status: true } }),
    prisma.poolBuild.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        salePrice: true,
        clientId: true,
        marginPct: true,
        updatedAt: true,
      },
    }),
    prisma.proposal.findMany({
      select: {
        id: true,
        status: true,
        total: true,
        discount: true,
        updatedAt: true,
        clientId: true,
      },
    }),
    prisma.contract.findMany({
      select: {
        id: true,
        status: true,
        signedDate: true,
        updatedAt: true,
        proposalId: true,
        proposal: { select: { clientId: true } },
      },
    }),
    prisma.invoice.findMany({
      select: { id: true, amount: true, status: true, paidAt: true, paidAmount: true, updatedAt: true, jobId: true },
    }),
    prisma.invoice.findMany({
      where: { paidAt: { gte: startOfYear, not: null } },
      select: { paidAt: true, paidAmount: true, amount: true },
    }),
    prisma.invoice.findMany({
      where: { paidAt: { gte: startOfThisMonth, not: null } },
      select: { paidAmount: true, amount: true },
    }),
    prisma.invoice.findMany({
      where: { paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      select: { paidAmount: true, amount: true },
    }),
    prisma.client.findMany({
      where: { createdAt: { gte: last30 } },
      select: { id: true },
    }),
    prisma.client.findMany({
      where: { leadScore: { gte: 5 } },
      select: { id: true },
    }),
    prisma.designProject.findMany({
      select: { id: true, status: true, updatedAt: true },
    }),
    prisma.job.findMany({
      where: { status: "ACTIVE" },
      include: {
        phases: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.maintenancePlan.findMany({
      where: { status: "ACTIVE" },
      orderBy: { nextDue: "asc" },
      take: 5,
    }),
  ]);

  // Client name lookup (single query)
  const clientIds = [
    ...new Set([
      ...poolBuilds.map((b) => b.clientId).filter((x): x is string => !!x),
      ...activeJobsRich.map((j) => j.clientId),
      ...maintenancePlans.map((m) => m.clientId),
      ...contracts.map((c) => c.proposal?.clientId).filter((x): x is string => !!x),
      ...proposals.map((p) => p.clientId),
    ]),
  ];
  const clientNames = clientIds.length
    ? await prisma.client.findMany({
        where: { id: { in: clientIds } },
        select: { id: true, name: true },
      })
    : [];
  const clientMap = Object.fromEntries(clientNames.map((c) => [c.id, c.name]));

  // -------- KPI 1 — Active Jobs --------
  const activeJobsCount = jobs.filter((j) => j.status === "ACTIVE").length;

  // Sort metrics chronologically (ascending) for sparklines
  const metricsChrono = [...weeklyMetrics].reverse();
  const dealsClosedSpark = metricsChrono.map((m) => ({ value: m.dealsClosed }));
  const proposalsSentSpark = metricsChrono.map((m) => ({ value: m.proposalsSent }));

  const thisWeek = weeklyMetrics[0];
  const lastWeek = weeklyMetrics[1];
  const dealsDelta =
    thisWeek && lastWeek != null
      ? thisWeek.dealsClosed - lastWeek.dealsClosed
      : 0;

  // -------- KPI 2 — Pipeline Value --------
  const pipelineValue =
    poolBuilds
      .filter((b) => b.status === "SOLD")
      .reduce((s, b) => s + (b.salePrice || 0), 0) +
    proposals
      .filter((p) => p.status === "SENT")
      .reduce((s, p) => s + (p.total - p.discount), 0);

  const proposalsSentDelta =
    thisWeek && lastWeek != null
      ? thisWeek.proposalsSent - lastWeek.proposalsSent
      : 0;

  // -------- KPI 3 — Revenue Collected (YTD) --------
  const revenueYtd = invoicesPaidYTD.reduce(
    (s, i) => s + (i.paidAmount ?? i.amount ?? 0),
    0
  );
  const revenueThisMonth = invoicesPaidThisMonth.reduce(
    (s, i) => s + (i.paidAmount ?? i.amount ?? 0),
    0
  );
  const revenueLastMonth = invoicesPaidLastMonth.reduce(
    (s, i) => s + (i.paidAmount ?? i.amount ?? 0),
    0
  );
  const revenueDeltaPct =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : revenueThisMonth > 0
        ? 100
        : 0;

  // Build 8-week sparkline of paid invoices
  const weekBuckets = Array.from({ length: 8 }, (_, i) => {
    const ws = startOfWeek(new Date(now.getTime() - (7 - i) * 7 * 24 * 60 * 60 * 1000));
    return { weekStart: ws, total: 0 };
  });
  for (const inv of invoicesAll) {
    if (!inv.paidAt) continue;
    const t = new Date(inv.paidAt).getTime();
    for (let i = weekBuckets.length - 1; i >= 0; i--) {
      if (t >= weekBuckets[i].weekStart.getTime()) {
        weekBuckets[i].total += inv.paidAmount ?? inv.amount ?? 0;
        break;
      }
    }
  }
  const revenueSpark = weekBuckets.map((b) => ({ value: b.total }));

  // -------- KPI 4 — Conversion Rate --------
  const proposalsSentOrAccepted = proposals.filter(
    (p) => p.status === "SENT" || p.status === "ACCEPTED"
  );
  const proposalsAccepted = proposals.filter((p) => p.status === "ACCEPTED");
  const conversionRate =
    proposalsSentOrAccepted.length > 0
      ? (proposalsAccepted.length / proposalsSentOrAccepted.length) * 100
      : 0;

  // Conversion sparkline: closed/sent ratio per week (capped 0..100)
  const conversionSpark = metricsChrono.map((m) => ({
    value: m.proposalsSent > 0 ? Math.min(100, (m.dealsClosed / m.proposalsSent) * 100) : 0,
  }));

  // -------- Funnel --------
  const newLeads30d = clientsRecent.length;
  const qualified = clientsQualified.length;
  const designsActive = designProjects.filter((d) => d.status !== "WAITING_INFO").length;
  const proposalsCount = proposals.filter(
    (p) => p.status === "SENT" || p.status === "ACCEPTED"
  ).length;
  const contractsSigned = contracts.filter((c) => c.status === "SIGNED").length;
  const built = jobs.filter((j) => j.status === "COMPLETE").length;

  const funnel: FunnelDatum[] = [
    { stage: "New Leads (30d)", count: newLeads30d, pct: 100 },
    { stage: "Qualified", count: qualified, pct: 0 },
    { stage: "In Design", count: designsActive, pct: 0 },
    { stage: "Proposals", count: proposalsCount, pct: 0 },
    { stage: "Contracts", count: contractsSigned, pct: 0 },
    { stage: "Built", count: built, pct: 0 },
  ];
  const top = funnel[0].count || 1;
  for (const f of funnel) f.pct = (f.count / top) * 100;

  // -------- Top Active Builds --------
  const topActiveBuilds = poolBuilds
    .filter((b) => b.status === "SOLD" || b.status === "IN_PROGRESS")
    .sort((a, b) => b.salePrice - a.salePrice)
    .slice(0, 5);

  // -------- Active jobs progress (small multiples) --------
  const activeJobsForCards = activeJobsRich
    .filter((j) => j.status === "ACTIVE")
    .slice(0, 3)
    .map((j) => {
      const total = j.phases.length;
      const complete = j.phases.filter((p) => p.status === "COMPLETE").length;
      const current =
        j.phases.find((p) => p.status === "IN_PROGRESS") ||
        j.phases.find((p) => p.status === "BLOCKED") ||
        j.phases.find((p) => p.status === "PENDING");
      return {
        id: j.id,
        name: j.name,
        clientName: clientMap[j.clientId] || "—",
        complete,
        total,
        percent: total ? Math.round((complete / total) * 100) : 0,
        currentPhase: current?.name ?? "Not started",
      };
    });

  // -------- Activity feed --------
  type Activity = {
    type: "contract" | "proposal" | "invoice" | "phase";
    when: Date;
    title: string;
    sub: string;
    href: string;
  };
  const activity: Activity[] = [];

  // Signed contracts
  for (const c of contracts) {
    if (c.status === "SIGNED" && c.signedDate) {
      const cName = c.proposal?.clientId ? clientMap[c.proposal.clientId] : "Client";
      activity.push({
        type: "contract",
        when: new Date(c.signedDate),
        title: "Contract signed",
        sub: cName ?? "Client",
        href: `/contracts/${c.id}`,
      });
    }
  }
  // Sent proposals
  for (const p of proposals) {
    if (p.status === "SENT" || p.status === "ACCEPTED") {
      activity.push({
        type: "proposal",
        when: new Date(p.updatedAt),
        title: p.status === "ACCEPTED" ? "Proposal accepted" : "Proposal sent",
        sub: `${clientMap[p.clientId] || "Client"} • ${usdK(p.total - p.discount)}`,
        href: `/proposals/${p.id}`,
      });
    }
  }
  // Paid invoices
  for (const inv of invoicesAll) {
    if (inv.paidAt) {
      activity.push({
        type: "invoice",
        when: new Date(inv.paidAt),
        title: "Invoice paid",
        sub: `${usdK(inv.paidAmount ?? inv.amount ?? 0)}`,
        href: `/accounting`,
      });
    }
  }
  // Completed phases
  for (const j of activeJobsRich) {
    for (const ph of j.phases) {
      if (ph.status === "COMPLETE" && ph.actualEnd) {
        activity.push({
          type: "phase",
          when: new Date(ph.actualEnd),
          title: `Phase complete: ${ph.name}`,
          sub: clientMap[j.clientId] || j.name,
          href: `/jobs/${j.id}`,
        });
      }
    }
  }

  const recentActivity = activity
    .sort((a, b) => b.when.getTime() - a.when.getTime())
    .slice(0, 8);

  const activityIcon: Record<Activity["type"], React.ComponentType<{ className?: string }>> = {
    contract: FileSignature,
    proposal: FileText,
    invoice: Receipt,
    phase: CheckCircle2,
  };

  const activityColor: Record<Activity["type"], string> = {
    contract: "text-green-500",
    proposal: "text-blue-500",
    invoice: "text-emerald-500",
    phase: "text-purple-500",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Snapshot of the business — leads, pipeline, jobs, and revenue."
        action={
          <div className="flex gap-2">
            <Link href="/builds/new">
              <Button size="sm" variant="outline">
                <Calculator className="h-4 w-4 mr-1" />
                New Build
              </Button>
            </Link>
            <Link href="/clients/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Client
              </Button>
            </Link>
          </div>
        }
      />

      {/* HERO KPI STRIP — 4 big tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile
          label="Active Jobs"
          value={activeJobsCount.toString()}
          icon={HardHat}
          delta={
            thisWeek && lastWeek != null
              ? { value: dealsDelta, suffix: "" }
              : null
          }
          context={`vs last week`}
          spark={dealsClosedSpark}
          sparkColor="#3b82f6"
        />
        <KpiTile
          label="Pipeline Value"
          value={usdK(pipelineValue)}
          icon={Target}
          delta={
            thisWeek && lastWeek != null
              ? { value: proposalsSentDelta, suffix: "" }
              : null
          }
          context="proposals this week"
          spark={proposalsSentSpark}
          sparkColor="#3b82f6"
        />
        <KpiTile
          label="Revenue YTD"
          value={usdK(revenueYtd)}
          icon={DollarSign}
          delta={{ value: revenueDeltaPct, suffix: "%" }}
          context="vs last month"
          spark={revenueSpark}
          sparkColor="#10b981"
        />
        <KpiTile
          label="Conversion Rate"
          value={pct(conversionRate, 0)}
          icon={TrendingUp}
          delta={null}
          context={`${proposalsAccepted.length} of ${proposalsSentOrAccepted.length} proposals`}
          spark={conversionSpark}
          sparkColor="#3b82f6"
        />
      </div>

      {/* SECONDARY ROW — funnel + top builds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pipeline Funnel</CardTitle>
              <span className="text-xs text-muted-foreground">
                {newLeads30d} new leads in last 30 days
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <FunnelBars data={funnel} />
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 px-3 text-xs">
              {funnel.slice(0, -1).map((f, i) => {
                const next = funnel[i + 1];
                const conv =
                  f.count > 0 ? Math.round((next.count / f.count) * 100) : 0;
                return (
                  <div
                    key={f.stage}
                    className="rounded border bg-muted/30 px-2 py-1.5"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                      {f.stage.split(" ")[0]} → {next.stage.split(" ")[0]}
                    </div>
                    <div className="font-semibold tabular-nums">
                      {conv}%
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Link href="/builds" className="flex items-center justify-between group">
              <CardTitle className="text-base">Top Active Builds</CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </CardHeader>
          <CardContent>
            {topActiveBuilds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active builds yet.</p>
            ) : (
              <div className="space-y-1">
                {topActiveBuilds.map((b) => (
                  <Link
                    key={b.id}
                    href={`/builds/${b.id}`}
                    className="flex items-center justify-between p-2 -mx-2 rounded hover:bg-accent group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {b.clientId ? clientMap[b.clientId] || "—" : "—"}
                      </p>
                    </div>
                    <div className="ml-2 shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {usdK(b.salePrice)}
                      </p>
                      <Badge
                        variant="secondary"
                        className={
                          b.status === "SOLD"
                            ? "bg-green-500/15 text-green-400"
                            : "bg-blue-500/15 text-blue-400"
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM ROW — 3 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active jobs progress */}
        <Card>
          <CardHeader className="pb-3">
            <Link href="/jobs" className="flex items-center justify-between group">
              <CardTitle className="text-base">Active Jobs Progress</CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </CardHeader>
          <CardContent>
            {activeJobsForCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active jobs.</p>
            ) : (
              <div className="space-y-3">
                {activeJobsForCards.map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="block p-2 -mx-2 rounded hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{j.name}</p>
                      <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0">
                        {j.complete}/{j.total}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${j.percent}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{j.currentPhase}</span>
                      <span className="shrink-0 ml-2">{j.clientName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ol className="space-y-2.5">
                {recentActivity.map((a, idx) => {
                  const Icon = activityIcon[a.type];
                  return (
                    <li key={idx}>
                      <Link
                        href={a.href}
                        className="flex items-start gap-2.5 p-1 -mx-1 rounded hover:bg-accent"
                      >
                        <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${activityColor[a.type]}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-tight">{a.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {a.sub}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                          {relativeTime(a.when)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Upcoming maintenance */}
        <Card>
          <CardHeader className="pb-3">
            <Link href="/maintenance" className="flex items-center justify-between group">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Upcoming
              </CardTitle>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </CardHeader>
          <CardContent>
            {maintenancePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              <ol className="space-y-2.5">
                {maintenancePlans.map((m) => {
                  const due = new Date(m.nextDue);
                  const days = Math.ceil(
                    (due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
                  );
                  const overdue = days < 0;
                  return (
                    <li key={m.id} className="flex items-start gap-2.5">
                      <div
                        className={`h-2 w-2 mt-1.5 rounded-full shrink-0 ${
                          overdue
                            ? "bg-red-500"
                            : days <= 7
                              ? "bg-yellow-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-tight truncate">{m.type}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {clientMap[m.clientId] || "Client"} • {m.cadence}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] tabular-nums shrink-0 ${
                          overdue
                            ? "text-red-500 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {overdue
                          ? `${Math.abs(days)}d late`
                          : days === 0
                            ? "today"
                            : `in ${days}d`}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
