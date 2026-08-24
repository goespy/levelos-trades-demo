import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "";
  const jobId = searchParams.get("jobId") || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (jobId) where.jobId = jobId;

  const reviews = await prisma.review.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      job: { select: { id: true, name: true, clientId: true } },
    },
  });

  // Enrich with client name
  const clientIds = [...new Set(reviews.map((r) => r.clientId))];
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true, email: true },
  });
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  const enriched = reviews.map((r) => ({
    ...r,
    client: clientMap[r.clientId] || null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: body.jobId },
    select: { id: true, clientId: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const review = await prisma.review.create({
    data: {
      jobId: job.id,
      clientId: job.clientId,
      status: "REQUESTED",
      requestSentAt: new Date(),
      platform: body.platform || "Google",
      requestToken: randomUUID(),
    },
  });

  return NextResponse.json(review, { status: 201 });
}
