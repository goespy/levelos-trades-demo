import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  const { id, phaseId } = await params;
  const body = await request.json();

  const existing = await prisma.jobPhase.findUnique({ where: { id: phaseId } });
  if (!existing || existing.jobId !== id) {
    return NextResponse.json({ error: "Phase not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.status !== undefined) {
    updateData.status = body.status;
    // Auto-set timestamps when status transitions
    if (body.status === "IN_PROGRESS" && !existing.actualStart) {
      updateData.actualStart = new Date();
    }
    if (body.status === "COMPLETE") {
      if (!existing.actualStart) updateData.actualStart = new Date();
      updateData.actualEnd = new Date();
    }
    if (body.status === "PENDING") {
      updateData.actualStart = null;
      updateData.actualEnd = null;
    }
  }

  if (body.subcontractorId !== undefined) {
    updateData.subcontractorId = body.subcontractorId || null;
  }
  if (body.notes !== undefined) updateData.notes = body.notes || null;
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description || null;
  if (body.scheduledStart !== undefined) {
    updateData.scheduledStart = body.scheduledStart ? new Date(body.scheduledStart) : null;
  }
  if (body.scheduledEnd !== undefined) {
    updateData.scheduledEnd = body.scheduledEnd ? new Date(body.scheduledEnd) : null;
  }
  if (body.actualStart !== undefined) {
    updateData.actualStart = body.actualStart ? new Date(body.actualStart) : null;
  }
  if (body.actualEnd !== undefined) {
    updateData.actualEnd = body.actualEnd ? new Date(body.actualEnd) : null;
  }

  const phase = await prisma.jobPhase.update({
    where: { id: phaseId },
    data: updateData,
    include: {
      subcontractor: {
        select: { id: true, name: true, trade: true, phone: true, email: true },
      },
    },
  });

  return NextResponse.json(phase);
}
