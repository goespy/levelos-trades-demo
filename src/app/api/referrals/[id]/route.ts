import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const referral = await prisma.referral.findUnique({ where: { id } });
  if (!referral) {
    return NextResponse.json({ error: "Referral not found" }, { status: 404 });
  }

  const referrer = await prisma.client.findUnique({
    where: { id: referral.referrerClientId },
    select: { id: true, name: true, email: true, phone: true },
  });

  return NextResponse.json({ ...referral, referrer });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.referral.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Referral not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.referredName !== undefined) data.referredName = body.referredName;
  if (body.referredPhone !== undefined) data.referredPhone = body.referredPhone;
  if (body.referredEmail !== undefined) data.referredEmail = body.referredEmail;
  if (body.rewardAmount !== undefined) data.rewardAmount = body.rewardAmount;
  if (body.notes !== undefined) data.notes = body.notes;

  // Auto-set rewardPaidAt when status moves to BUILT and rewardAmount is set
  if (body.status === "BUILT" && (body.rewardAmount ?? existing.rewardAmount) && !existing.rewardPaidAt) {
    data.rewardPaidAt = new Date();
  }

  if (body.rewardPaidAt !== undefined) {
    data.rewardPaidAt = body.rewardPaidAt ? new Date(body.rewardPaidAt) : null;
  }

  const referral = await prisma.referral.update({ where: { id }, data });
  return NextResponse.json(referral);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.referral.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
