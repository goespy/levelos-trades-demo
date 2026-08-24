import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "";
  const clientId = searchParams.get("clientId") || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;

  const plans = await prisma.maintenancePlan.findMany({
    where,
    orderBy: { nextDue: "asc" },
  });

  // Enrich with client + job names
  const clientIds = [...new Set(plans.map((p) => p.clientId))];
  const jobIds = [...new Set(plans.map((p) => p.jobId).filter((j): j is string => Boolean(j)))];

  const [clients, jobs] = await Promise.all([
    prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true },
    }),
    jobIds.length
      ? prisma.job.findMany({
          where: { id: { in: jobIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j.name]));

  const enriched = plans.map((p) => ({
    ...p,
    clientName: clientMap[p.clientId] || "Unknown",
    jobName: p.jobId ? jobMap[p.jobId] || null : null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.clientId) {
      return NextResponse.json({ error: "Missing required field: clientId" }, { status: 400 });
    }
    if (!body.type) {
      return NextResponse.json({ error: "Missing required field: type" }, { status: 400 });
    }
    if (!body.cadence) {
      return NextResponse.json({ error: "Missing required field: cadence" }, { status: 400 });
    }
    if (!body.nextDue) {
      return NextResponse.json({ error: "Missing required field: nextDue" }, { status: 400 });
    }

    const plan = await prisma.maintenancePlan.create({
      data: {
        clientId: body.clientId,
        jobId: body.jobId || null,
        type: body.type,
        cadence: body.cadence,
        nextDue: new Date(body.nextDue),
        amount: typeof body.amount === "number" ? body.amount : null,
        status: body.status || "ACTIVE",
        notes: body.notes || null,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    console.error("POST /api/maintenance failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
