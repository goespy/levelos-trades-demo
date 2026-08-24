import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const sub = await prisma.subcontractor.findUnique({
    where: { id },
    include: {
      jobPhases: {
        orderBy: { updatedAt: "desc" },
        take: 25,
        include: {
          job: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });

  if (!sub) {
    return NextResponse.json({ error: "Subcontractor not found" }, { status: 404 });
  }

  return NextResponse.json(sub);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.subcontractor.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Subcontractor not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.trade !== undefined) updateData.trade = body.trade;
  if (body.contact !== undefined) updateData.contact = body.contact || null;
  if (body.email !== undefined) updateData.email = body.email || null;
  if (body.phone !== undefined) updateData.phone = body.phone || null;
  if (body.licenseNumber !== undefined) updateData.licenseNumber = body.licenseNumber || null;
  if (body.insuranceExpires !== undefined) {
    updateData.insuranceExpires = body.insuranceExpires ? new Date(body.insuranceExpires) : null;
  }
  if (body.hourlyRate !== undefined) {
    updateData.hourlyRate = body.hourlyRate === null || body.hourlyRate === ""
      ? null
      : Number(body.hourlyRate);
  }
  if (body.rating !== undefined) {
    updateData.rating = body.rating === null || body.rating === ""
      ? null
      : Number(body.rating);
  }
  if (body.notes !== undefined) updateData.notes = body.notes || null;
  if (body.active !== undefined) updateData.active = Boolean(body.active);

  const sub = await prisma.subcontractor.update({ where: { id }, data: updateData });
  return NextResponse.json(sub);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.subcontractor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
