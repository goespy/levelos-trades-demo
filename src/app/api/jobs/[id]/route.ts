import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      phases: {
        orderBy: { sortOrder: "asc" },
        include: {
          subcontractor: {
            select: { id: true, name: true, trade: true, phone: true, email: true },
          },
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const client = await prisma.client.findUnique({
    where: { id: job.clientId },
    select: { id: true, name: true, email: true, phone: true, address: true, city: true, zip: true },
  });

  const total = job.phases.length;
  const complete = job.phases.filter((p) => p.status === "COMPLETE").length;
  const progress = {
    complete,
    total,
    percent: total ? Math.round((complete / total) * 100) : 0,
  };

  return NextResponse.json({ ...job, client, progress });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.startDate !== undefined) {
    updateData.startDate = body.startDate ? new Date(body.startDate) : null;
  }
  if (body.expectedEndDate !== undefined) {
    updateData.expectedEndDate = body.expectedEndDate ? new Date(body.expectedEndDate) : null;
  }
  if (body.actualEndDate !== undefined) {
    updateData.actualEndDate = body.actualEndDate ? new Date(body.actualEndDate) : null;
  }

  const job = await prisma.job.update({ where: { id }, data: updateData });
  return NextResponse.json(job);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
