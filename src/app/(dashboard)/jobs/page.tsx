import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  JobsOverviewClient,
  type JobCard,
  type SubUtil,
  type RecentActivityItem,
} from "./jobs-overview-client";

export const dynamic = "force-dynamic";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default async function JobsPage() {
  // ─── Pull data ────────────────────────────────────────────────────────
  const [jobs, subs] = await Promise.all([
    prisma.job.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        phases: {
          orderBy: { sortOrder: "asc" },
          include: {
            subcontractor: {
              select: { id: true, name: true, trade: true, phone: true },
            },
          },
        },
      },
    }),
    prisma.subcontractor.findMany({
      where: { active: true },
      include: {
        jobPhases: {
          select: { id: true, status: true },
        },
      },
    }),
  ]);

  const clientIds = [...new Set(jobs.map((j) => j.clientId))];
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true },
  });
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  // ─── Shape job cards ──────────────────────────────────────────────────
  const jobCards: JobCard[] = jobs.map((j) => {
    const total = j.phases.length;
    const complete = j.phases.filter((p) => p.status === "COMPLETE").length;
    const current =
      j.phases.find((p) => p.status === "IN_PROGRESS") ||
      j.phases.find((p) => p.status === "BLOCKED") ||
      j.phases.find((p) => p.status === "PENDING");

    return {
      id: j.id,
      name: j.name,
      status: j.status,
      startDate: j.startDate?.toISOString() ?? null,
      expectedEndDate: j.expectedEndDate?.toISOString() ?? null,
      clientName: clientMap.get(j.clientId) ?? null,
      phases: j.phases.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        sortOrder: p.sortOrder,
        subcontractorName: p.subcontractor?.name ?? null,
        subcontractorPhone: p.subcontractor?.phone ?? null,
        subcontractorTrade: p.subcontractor?.trade ?? null,
      })),
      progressComplete: complete,
      progressTotal: total,
      progressPct: total ? Math.round((complete / total) * 100) : 0,
      currentPhaseName: current?.name ?? null,
      currentPhaseSub: current?.subcontractor?.name ?? null,
      currentPhaseSubPhone: current?.subcontractor?.phone ?? null,
    };
  });

  // ─── KPIs ─────────────────────────────────────────────────────────────
  const activeJobs = jobs.filter((j) => j.status === "ACTIVE");
  const onHoldJobs = jobs.filter((j) => j.status === "ON_HOLD");

  const inProgressPhases = jobs
    .filter((j) => j.status === "ACTIVE" || j.status === "ON_HOLD")
    .reduce(
      (acc, j) => acc + j.phases.filter((p) => p.status === "IN_PROGRESS").length,
      0,
    );

  const blockedPhases = jobs
    .filter((j) => j.status === "ACTIVE" || j.status === "ON_HOLD")
    .reduce(
      (acc, j) => acc + j.phases.filter((p) => p.status === "BLOCKED").length,
      0,
    );

  // Avg days per phase (across COMPLETE phases)
  const completePhases = jobs.flatMap((j) =>
    j.phases.filter((p) => p.status === "COMPLETE" && p.actualStart && p.actualEnd),
  );
  let avgDaysPerPhase: number | null = null;
  if (completePhases.length > 0) {
    const totalDays = completePhases.reduce((acc, p) => {
      const ms = p.actualEnd!.getTime() - p.actualStart!.getTime();
      return acc + Math.max(1, Math.round(ms / MS_PER_DAY));
    }, 0);
    avgDaysPerPhase = Math.round(totalDays / completePhases.length);
  }

  // Avg scheduled days per phase
  const scheduled = jobs.flatMap((j) =>
    j.phases.filter((p) => p.scheduledStart && p.scheduledEnd),
  );
  let avgScheduledDaysPerPhase: number | null = null;
  if (scheduled.length > 0) {
    const totalDays = scheduled.reduce((acc, p) => {
      const ms = p.scheduledEnd!.getTime() - p.scheduledStart!.getTime();
      return acc + Math.max(1, Math.round(ms / MS_PER_DAY));
    }, 0);
    avgScheduledDaysPerPhase = Math.round(totalDays / scheduled.length);
  }

  // New active jobs this calendar month (approximation: createdAt within current month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = activeJobs.filter((j) => j.createdAt >= monthStart).length;

  // ─── Sub utilization (top 6) ──────────────────────────────────────────
  const subUtilization: SubUtil[] = subs
    .map((s) => {
      const activeCount = s.jobPhases.filter(
        (p) => p.status === "IN_PROGRESS" || p.status === "PENDING",
      ).length;
      const days = s.insuranceExpires
        ? Math.floor((s.insuranceExpires.getTime() - Date.now()) / MS_PER_DAY)
        : null;
      return {
        id: s.id,
        name: s.name,
        trade: s.trade,
        activeCount,
        insuranceExpiringDays: days,
      };
    })
    .filter((s) => s.activeCount > 0)
    .sort((a, b) => b.activeCount - a.activeCount)
    .slice(0, 6);

  // ─── Phase Distribution (across active + on-hold) ─────────────────────
  const distMap: Record<string, number> = {
    PENDING: 0,
    IN_PROGRESS: 0,
    BLOCKED: 0,
    COMPLETE: 0,
  };
  for (const j of jobs) {
    if (j.status !== "ACTIVE" && j.status !== "ON_HOLD") continue;
    for (const p of j.phases) {
      if (distMap[p.status] !== undefined) distMap[p.status] += 1;
    }
  }
  const phaseDistribution = (
    ["PENDING", "IN_PROGRESS", "BLOCKED", "COMPLETE"] as const
  ).map((status) => ({ status, count: distMap[status] }));

  // ─── Recent Activity (top 6 most recently updated phases) ─────────────
  const recentPhases = await prisma.jobPhase.findMany({
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: {
      job: { select: { id: true, name: true } },
    },
  });
  const recentActivity: RecentActivityItem[] = recentPhases.map((p) => ({
    id: p.id,
    phaseName: p.name,
    jobName: p.job.name,
    jobId: p.jobId,
    status: p.status,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Jobs"
        description={`${activeJobs.length} active · ${onHoldJobs.length} on hold · ${jobs.filter((j) => j.status === "COMPLETE").length} complete`}
        action={
          <Link href="/jobs">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Job
            </Button>
          </Link>
        }
      />

      <JobsOverviewClient
        kpi={{
          activeCount: activeJobs.length,
          newThisMonth,
          inProgressPhases,
          blockedPhases,
          avgDaysPerPhase,
          avgScheduledDaysPerPhase,
        }}
        jobs={jobCards}
        subUtilization={subUtilization}
        phaseDistribution={phaseDistribution}
        recentActivity={recentActivity}
      />
    </div>
  );
}
