import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "";
  const clientId = searchParams.get("clientId") || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;

  const jobs = await prisma.job.findMany({
    where,
    include: {
      phases: {
        orderBy: { sortOrder: "asc" },
        include: {
          subcontractor: { select: { id: true, name: true, trade: true, phone: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Enrich with client name
  const clientIds = [...new Set(jobs.map((j) => j.clientId))];
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  const enriched = jobs.map((j) => {
    const total = j.phases.length;
    const complete = j.phases.filter((p) => p.status === "COMPLETE").length;
    const current = j.phases.find((p) => p.status === "IN_PROGRESS")
      || j.phases.find((p) => p.status === "BLOCKED")
      || j.phases.find((p) => p.status === "PENDING");
    return {
      ...j,
      client: clientMap[j.clientId] || null,
      progress: { complete, total, percent: total ? Math.round((complete / total) * 100) : 0 },
      currentPhaseName: current?.name || null,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.contractId) {
    return NextResponse.json({ error: "contractId is required" }, { status: 400 });
  }

  const contract = await prisma.contract.findUnique({
    where: { id: body.contractId },
    include: { proposal: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Prevent duplicate jobs per contract
  const existing = await prisma.job.findUnique({ where: { contractId: contract.id } });
  if (existing) {
    return NextResponse.json({ error: "Job already exists for this contract", jobId: existing.id }, { status: 409 });
  }

  const client = await prisma.client.findUnique({
    where: { id: contract.proposal.clientId },
    select: { name: true },
  });

  const job = await prisma.job.create({
    data: {
      contractId: contract.id,
      clientId: contract.proposal.clientId,
      proposalId: contract.proposalId,
      name: body.name || `${client?.name || "Client"} — Pool Build`,
      status: "ACTIVE",
      startDate: body.startDate ? new Date(body.startDate) : null,
      expectedEndDate: body.expectedEndDate ? new Date(body.expectedEndDate) : null,
      portalToken: randomUUID(),
      notes: body.notes || null,
    },
  });

  // Create default 6-phase pipeline
  const defaultPhases = [
    "Permits & Plans",
    "Pool Shell",
    "Tile & Coping",
    "Deck & Pumps",
    "Screen Cage",
    "Pool Finish",
  ];
  await Promise.all(
    defaultPhases.map((name, idx) =>
      prisma.jobPhase.create({
        data: {
          jobId: job.id,
          name,
          sortOrder: idx,
          status: "PENDING",
        },
      })
    )
  );

  return NextResponse.json(job, { status: 201 });
}
