import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "";
  const referrerClientId = searchParams.get("referrerClientId") || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (referrerClientId) where.referrerClientId = referrerClientId;

  const referrals = await prisma.referral.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Enrich with referrer client name
  const clientIds = [...new Set(referrals.map((r) => r.referrerClientId))];
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true },
  });
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const enriched = referrals.map((r) => ({
    ...r,
    referrerName: clientMap[r.referrerClientId] || "Unknown",
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.referrerClientId || !body.referredName) {
    return NextResponse.json(
      { error: "referrerClientId and referredName are required" },
      { status: 400 }
    );
  }

  const referral = await prisma.referral.create({
    data: {
      referrerClientId: body.referrerClientId,
      referredName: body.referredName,
      referredPhone: body.referredPhone || null,
      referredEmail: body.referredEmail || null,
      status: body.status || "PENDING",
      rewardAmount: body.rewardAmount ?? null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(referral, { status: 201 });
}
