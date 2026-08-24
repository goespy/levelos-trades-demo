import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const metrics = await prisma.weeklyMetric.findMany({
    orderBy: { weekStartDate: "desc" },
    take: 12,
  });

  return NextResponse.json(metrics);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const metric = await prisma.weeklyMetric.upsert({
    where: { weekStartDate: new Date(body.weekStartDate) },
    update: {
      newLeads: body.newLeads ?? 0,
      formsCompleted: body.formsCompleted ?? 0,
      qualifyingCalls: body.qualifyingCalls ?? 0,
      designsStarted: body.designsStarted ?? 0,
      appointmentsSet: body.appointmentsSet ?? 0,
      proposalsSent: body.proposalsSent ?? 0,
      dealsClosed: body.dealsClosed ?? 0,
      notes: body.notes || null,
    },
    create: {
      weekStartDate: new Date(body.weekStartDate),
      newLeads: body.newLeads ?? 0,
      formsCompleted: body.formsCompleted ?? 0,
      qualifyingCalls: body.qualifyingCalls ?? 0,
      designsStarted: body.designsStarted ?? 0,
      appointmentsSet: body.appointmentsSet ?? 0,
      proposalsSent: body.proposalsSent ?? 0,
      dealsClosed: body.dealsClosed ?? 0,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(metric, { status: 201 });
}
