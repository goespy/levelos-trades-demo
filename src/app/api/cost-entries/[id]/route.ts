import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.jobCostEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Cost entry not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  const allowed = ["category", "vendor", "description", "amount", "date", "receiptUrl", "notes"];
  for (const k of allowed) {
    if (k in body) {
      if (k === "date" && body[k]) {
        updateData[k] = new Date(body[k]);
      } else {
        updateData[k] = body[k];
      }
    }
  }

  const entry = await prisma.jobCostEntry.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(entry);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.jobCostEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
