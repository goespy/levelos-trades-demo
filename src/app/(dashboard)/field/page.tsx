import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Smartphone, Zap, AlertOctagon, Calendar, Clock4 } from "lucide-react";
import { FieldActiveCards } from "./field-active-cards";

export const dynamic = "force-dynamic";

export default async function FieldPage() {
  // Pull all phases on active jobs for KPI strip.
  const activeJobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    include: { phases: true },
  });

  const allPhases = activeJobs.flatMap((j) => j.phases);

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const sevenDaysFromNow = new Date(
    startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000
  );

  const inProgressCount = allPhases.filter(
    (p) => p.status === "IN_PROGRESS"
  ).length;

  const blockedCount = allPhases.filter((p) => p.status === "BLOCKED").length;

  const completingThisWeek = allPhases.filter((p) => {
    if (!p.scheduledEnd) return false;
    if (p.status === "COMPLETE") return false;
    const end = new Date(p.scheduledEnd);
    return end >= startOfToday && end <= sevenDaysFromNow;
  }).length;

  const atRiskCount = allPhases.filter((p) => {
    if (!p.scheduledEnd) return false;
    if (p.status === "COMPLETE") return false;
    return new Date(p.scheduledEnd) < startOfToday;
  }).length;

  return (
    <div>
      <PageHeader
        title="Field View"
        description={
          <span className="inline-flex items-center gap-2">
            <Smartphone className="h-3.5 w-3.5" />
            Live status across {activeJobs.length} active job
            {activeJobs.length === 1 ? "" : "s"}
          </span>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-[11px] uppercase tracking-wide">
              In Progress
            </span>
          </div>
          <p className="text-3xl font-bold mt-1.5 tabular-nums">
            {inProgressCount}
          </p>
          <p className="text-[11px] text-muted-foreground">phases active now</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertOctagon className="h-3.5 w-3.5" />
            <span className="text-[11px] uppercase tracking-wide">Blocked</span>
          </div>
          <p
            className={`text-3xl font-bold mt-1.5 tabular-nums ${
              blockedCount > 0 ? "text-red-500" : ""
            }`}
          >
            {blockedCount}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {blockedCount > 0 ? "needs unblocking" : "no blockers"}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[11px] uppercase tracking-wide">
              This Week
            </span>
          </div>
          <p className="text-3xl font-bold mt-1.5 tabular-nums">
            {completingThisWeek}
          </p>
          <p className="text-[11px] text-muted-foreground">due in 7 days</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock4 className="h-3.5 w-3.5" />
            <span className="text-[11px] uppercase tracking-wide">At Risk</span>
          </div>
          <p
            className={`text-3xl font-bold mt-1.5 tabular-nums ${
              atRiskCount > 0 ? "text-red-500" : ""
            }`}
          >
            {atRiskCount}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {atRiskCount > 0 ? "behind schedule" : "all on track"}
          </p>
        </div>
      </div>

      <FieldActiveCards />
    </div>
  );
}
