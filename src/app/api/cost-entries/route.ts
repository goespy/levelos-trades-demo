import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get("jobId") || "";
  const category = searchParams.get("category") || "";

  const where: Record<string, unknown> = {};
  if (jobId) where.jobId = jobId;
  if (category) where.category = category;

  const entries = await prisma.jobCostEntry.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.jobId) {
      return NextResponse.json({ error: "Missing required field: jobId" }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: "Missing required field: category" }, { status: 400 });
    }
    if (!body.description) {
      return NextResponse.json({ error: "Missing required field: description" }, { status: 400 });
    }
    if (typeof body.amount !== "number" || body.amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const entry = await prisma.jobCostEntry.create({
      data: {
        jobId: body.jobId,
        category: body.category,
        vendor: body.vendor || null,
        description: body.description,
        amount: body.amount,
        date: body.date ? new Date(body.date) : new Date(),
        receiptUrl: body.receiptUrl || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("POST /api/cost-entries failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
