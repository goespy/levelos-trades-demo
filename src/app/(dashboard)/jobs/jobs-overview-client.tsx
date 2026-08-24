"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Phone,
  ChevronRight,
  Activity,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────

export interface PhasePill {
  id: string;
  name: string;
  status: string;
  sortOrder: number;
  subcontractorName: string | null;
  subcontractorPhone: string | null;
  subcontractorTrade: string | null;
}

export interface JobCard {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  expectedEndDate: string | null;
  clientName: string | null;
  phases: PhasePill[];
  progressComplete: number;
  progressTotal: number;
  progressPct: number;
  currentPhaseName: string | null;
  currentPhaseSub: string | null;
  currentPhaseSubPhone: string | null;
}

export interface SubUtil {
  id: string;
  name: string;
  trade: string;
  activeCount: number;
  insuranceExpiringDays: number | null;
}

export interface RecentActivityItem {
  id: string;
  phaseName: string;
  jobName: string;
  jobId: string;
  status: string;
  updatedAt: string;
}

export interface JobsOverviewProps {
  kpi: {
    activeCount: number;
    newThisMonth: number;
    inProgressPhases: number;
    blockedPhases: number;
    avgDaysPerPhase: number | null;
    avgScheduledDaysPerPhase: number | null;
  };
  jobs: JobCard[];
  subUtilization: SubUtil[];
  phaseDistribution: { status: string; count: number }[];
  recentActivity: RecentActivityItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────

const PHASE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETE: "Complete",
};

// Tableau-ish palette: green=good, blue=in-flight, red=problem, gray=pending
const PHASE_COLORS: Record<string, string> = {
  PENDING: "#94a3b8", // slate-400
  IN_PROGRESS: "#3b82f6", // blue-500
  BLOCKED: "#ef4444", // red-500
  COMPLETE: "#10b981", // emerald-500
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "ON_HOLD", label: "On Hold" },
  { key: "COMPLETE", label: "Complete" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

// ─── Phase Pill ───────────────────────────────────────────────────────────

function PhasePillView({ phase }: { phase: PhasePill }) {
  const isInProgress = phase.status === "IN_PROGRESS";
  const isBlocked = phase.status === "BLOCKED";
  const isComplete = phase.status === "COMPLETE";

  // base classes
  let className =
    "relative flex-1 min-w-0 rounded-md px-2 py-1.5 text-[10px] font-medium border transition-colors";

  if (isComplete) {
    className +=
      " bg-emerald-500/15 text-emerald-500 border-emerald-500/30 dark:text-emerald-400";
  } else if (isInProgress) {
    className +=
      " bg-blue-500/15 text-blue-500 border-blue-500/40 dark:text-blue-400 ring-1 ring-blue-500/30";
  } else if (isBlocked) {
    className += " bg-red-500/15 text-red-500 border-red-500/40 dark:text-red-400";
  } else {
    className += " bg-muted/60 text-muted-foreground border-border/60";
  }

  return (
    <div className={className} title={`${phase.name} — ${PHASE_STATUS_LABEL[phase.status] || phase.status}`}>
      <div className="flex items-center gap-1 min-w-0">
        {isComplete && <CheckCircle2 className="h-3 w-3 shrink-0" />}
        {isInProgress && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
        )}
        {isBlocked && <AlertTriangle className="h-3 w-3 shrink-0" />}
        <span className="truncate">{phase.name}</span>
      </div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────

function JobCardView({ job }: { job: JobCard }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{job.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {job.clientName || "—"}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={
              job.status === "ACTIVE"
                ? "bg-blue-500/15 text-blue-500 dark:text-blue-400"
                : job.status === "ON_HOLD"
                  ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                  : job.status === "COMPLETE"
                    ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
            }
          >
            {job.status === "ON_HOLD" ? "On Hold" : job.status === "ACTIVE" ? "Active" : "Complete"}
          </Badge>
        </div>

        {/* phase pills */}
        <div className="flex items-center gap-1">
          {job.phases.map((p) => (
            <PhasePillView key={p.id} phase={p} />
          ))}
        </div>

        {/* progress */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${job.progressPct}%` }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums w-10 text-right">
              {job.progressPct}%
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
            {job.progressComplete} / {job.progressTotal} phases complete
          </p>
        </div>

        {/* footer: dates + sub + button */}
        <div className="flex items-end justify-between gap-2 pt-1 border-t">
          <div className="text-[11px] text-muted-foreground space-y-0.5 min-w-0">
            <div className="tabular-nums">
              {fmtDate(job.startDate)} → {fmtDate(job.expectedEndDate)}
            </div>
            {job.currentPhaseName && (
              <div className="truncate">
                <span className="text-foreground/80">Now:</span> {job.currentPhaseName}
                {job.currentPhaseSub && (
                  <>
                    {" · "}
                    <span>{job.currentPhaseSub}</span>
                  </>
                )}
              </div>
            )}
            {job.currentPhaseSubPhone && (
              <a
                href={`tel:${job.currentPhaseSubPhone}`}
                className="inline-flex items-center gap-1 text-blue-500 dark:text-blue-400 hover:underline tabular-nums"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3 w-3" />
                {job.currentPhaseSubPhone}
              </a>
            )}
          </div>
          <Link href={`/jobs/${job.id}`}>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              View
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Phase Distribution Chart ─────────────────────────────────────────────

function PhaseDistribution({ data }: { data: { status: string; count: number }[] }) {
  const chartData = data.map((d) => ({
    name: PHASE_STATUS_LABEL[d.status] || d.status,
    status: d.status,
    count: d.count,
    fill: PHASE_COLORS[d.status] || "#94a3b8",
  }));

  return (
    <div className="h-[180px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "currentColor" }}
            tickLine={false}
            axisLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(120,120,120,0.06)" }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────

export function JobsOverviewClient(props: JobsOverviewProps) {
  const { kpi, jobs, subUtilization, phaseDistribution, recentActivity } = props;
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") {
      return jobs.filter((j) => j.status === "ACTIVE" || j.status === "ON_HOLD");
    }
    return jobs.filter((j) => j.status === filter);
  }, [filter, jobs]);

  const blockedColor = kpi.blockedPhases > 0 ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400";

  return (
    <div className="space-y-6">
      {/* ─── 1. KPI strip ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              <span>Active Jobs</span>
            </div>
            <p className="text-3xl font-bold tabular-nums mt-2">{kpi.activeCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
              {kpi.newThisMonth > 0
                ? `+${kpi.newThisMonth} this month`
                : "in production"}
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>In-Progress Phases</span>
            </div>
            <p className="text-3xl font-bold tabular-nums mt-2 text-blue-500 dark:text-blue-400">
              {kpi.inProgressPhases}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">across active jobs</p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {kpi.blockedPhases > 0 ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>Blocked / At Risk</span>
            </div>
            <p className={`text-3xl font-bold tabular-nums mt-2 ${blockedColor}`}>
              {kpi.blockedPhases}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {kpi.blockedPhases > 0 ? "phases need attention" : "All on track"}
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              <span>Avg Days / Phase</span>
            </div>
            <p className="text-3xl font-bold tabular-nums mt-2">
              {kpi.avgDaysPerPhase !== null ? kpi.avgDaysPerPhase : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">
              {kpi.avgScheduledDaysPerPhase !== null
                ? `vs ${kpi.avgScheduledDaysPerPhase} scheduled`
                : "from completed phases"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filter pills ─── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count =
              f.key === "ALL"
                ? jobs.filter((j) => j.status === "ACTIVE" || j.status === "ON_HOLD").length
                : jobs.filter((j) => j.status === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  active
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
                <span
                  className={`tabular-nums text-[10px] rounded-full px-1.5 py-0.5 ${
                    active ? "bg-muted text-foreground" : "bg-muted/50"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          Showing {filtered.length} job{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ─── 2. Two-column row: phase map + sub utilization ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Phase Map (2/3) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Active Jobs Phase Map
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Complete
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Active
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Blocked
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Pending
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No jobs match this filter.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((j) => (
                <JobCardView key={j.id} job={j} />
              ))}
            </div>
          )}
        </div>

        {/* Subcontractor Utilization (1/3) */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Sub Utilization
          </h2>
          <Card>
            <CardContent className="py-2">
              {subUtilization.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No active subs
                </p>
              ) : (
                <ul className="divide-y">
                  {subUtilization.map((s) => {
                    const max = Math.max(...subUtilization.map((x) => x.activeCount), 1);
                    const pct = (s.activeCount / max) * 100;
                    const expSoon =
                      s.insuranceExpiringDays !== null && s.insuranceExpiringDays <= 30;
                    return (
                      <li key={s.id} className="py-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium truncate">{s.name}</p>
                              {expSoon && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-red-500 dark:text-red-400"
                                  title={`Insurance expires in ${s.insuranceExpiringDays}d`}
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{s.trade}</p>
                          </div>
                          <span className="text-sm font-semibold tabular-nums shrink-0">
                            {s.activeCount}
                          </span>
                        </div>
                        <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 dark:bg-blue-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── 3. Bottom row: distribution + activity ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Phase Distribution */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Phase Distribution
          </h2>
          <Card>
            <CardContent className="px-2 pt-2">
              <PhaseDistribution data={phaseDistribution} />
              <div className="grid grid-cols-4 gap-2 px-2 pt-2 border-t mt-2">
                {phaseDistribution.map((d) => (
                  <div key={d.status} className="text-center">
                    <p className="text-lg font-bold tabular-nums" style={{ color: PHASE_COLORS[d.status] }}>
                      {d.count}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {PHASE_STATUS_LABEL[d.status]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Phase Activity
          </h2>
          <Card>
            <CardContent className="py-2">
              {recentActivity.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No recent activity
                </p>
              ) : (
                <ul className="divide-y">
                  {recentActivity.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/jobs/${a.jobId}`}
                        className="flex items-center justify-between gap-2 py-2 hover:bg-accent/50 -mx-2 px-2 rounded transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{a.phaseName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {a.jobName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                            style={{
                              backgroundColor: `${PHASE_COLORS[a.status]}26`,
                              color: PHASE_COLORS[a.status],
                            }}
                          >
                            {PHASE_STATUS_LABEL[a.status]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground tabular-nums w-12 text-right">
                            {relTime(a.updatedAt)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
