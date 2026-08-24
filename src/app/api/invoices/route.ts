import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "";
  const jobId = searchParams.get("jobId") || "";
  const clientId = searchParams.get("clientId") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (jobId) where.jobId = jobId;
  if (clientId) where.clientId = clientId;

  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    where.createdAt = dateFilter;
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Enrich with client + job names
  const clientIds = [...new Set(invoices.map((i) => i.clientId))];
  const jobIds = [...new Set(invoices.map((i) => i.jobId))];

  const [clients, jobs] = await Promise.all([
    prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true },
    }),
    prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, name: true },
    }),
  ]);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j.name]));

  const enriched = invoices.map((i) => ({
    ...i,
    clientName: clientMap[i.clientId] || "Unknown",
    jobName: jobMap[i.jobId] || "Unknown",
  }));

  return NextResponse.json(enriched);
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  let nextSeq = 1;
  if (last?.number) {
    const tail = last.number.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!Number.isNaN(parsed)) nextSeq = parsed + 1;
  }
  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.jobId) {
      return NextResponse.json({ error: "Missing required field: jobId" }, { status: 400 });
    }
    if (typeof body.amount !== "number" || body.amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!body.phaseLabel) {
      return NextResponse.json({ error: "Missing required field: phaseLabel" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: body.jobId },
      select: { id: true, clientId: true },
    });
    if (!job) {
      return NextResponse.json({ error: `Job not found: ${body.jobId}` }, { status: 404 });
    }

    const number = body.number || (await nextInvoiceNumber());

    const invoice = await prisma.invoice.create({
      data: {
        jobId: job.id,
        clientId: job.clientId,
        number,
        phaseLabel: body.phaseLabel,
        amount: body.amount,
        description: body.description || null,
        status: body.status || "DRAFT",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes || null,
        payToken: randomUUID(),
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error("POST /api/invoices failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
