import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CADENCE_MONTHS } from "@/lib/constants";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.maintenancePlan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Maintenance plan not found" }, { status: 404 });
  }

  // Special action: complete + reschedule
  if (body.action === "complete_and_reschedule") {
    const cadence = existing.cadence;
    const months = CADENCE_MONTHS[cadence] ?? 12;
    const newDue = new Date(existing.nextDue);
    // Use UTC math to avoid local-tz drift across DST boundaries
    newDue.setUTCMonth(newDue.getUTCMonth() + months);

    const plan = await prisma.maintenancePlan.update({
      where: { id },
      data: {
        nextDue: newDue,
      },
    });
    return NextResponse.json(plan);
  }

  const updateData: Record<string, unknown> = {};
  const allowed = ["clientId", "jobId", "type", "cadence", "nextDue", "amount", "status", "notes"];
  for (const k of allowed) {
    if (k in body) {
      if (k === "nextDue" && body[k]) {
        updateData[k] = new Date(body[k]);
      } else {
        updateData[k] = body[k];
      }
    }
  }

  const plan = await prisma.maintenancePlan.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(plan);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.maintenancePlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
