import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const job = await prisma.job.findUnique({
    where: { portalToken: token },
    include: {
      phases: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          sortOrder: true,
          status: true,
          scheduledStart: true,
          scheduledEnd: true,
          actualStart: true,
          actualEnd: true,
          notes: true,
          photos: true,
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Portal not found" }, { status: 404 });
  }

  // Fetch client name only — no PII like email/phone needed for portal display
  const client = await prisma.client.findUnique({
    where: { id: job.clientId },
    select: { name: true, city: true },
  });

  // Compute portal-safe payload (no internal data like contractId/proposalId/COGS)
  const total = job.phases.length;
  const complete = job.phases.filter((p) => p.status === "COMPLETE").length;
  const currentPhase =
    job.phases.find((p) => p.status === "IN_PROGRESS") ||
    job.phases.find((p) => p.status === "BLOCKED") ||
    job.phases.find((p) => p.status === "PENDING");

  return NextResponse.json({
    jobName: job.name,
    status: job.status,
    startDate: job.startDate,
    expectedEndDate: job.expectedEndDate,
    actualEndDate: job.actualEndDate,
    clientName: client?.name || "Customer",
    clientCity: client?.city || null,
    progress: {
      complete,
      total,
      percent: total ? Math.round((complete / total) * 100) : 0,
    },
    currentPhase: currentPhase
      ? { name: currentPhase.name, status: currentPhase.status }
      : null,
    phases: job.phases.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      sortOrder: p.sortOrder,
      status: p.status,
      scheduledStart: p.scheduledStart,
      scheduledEnd: p.scheduledEnd,
      actualStart: p.actualStart,
      actualEnd: p.actualEnd,
      notes: p.notes,
      photos: p.photos,
    })),
  });
}
