import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, name: true, clientId: true } },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const client = await prisma.client.findUnique({
    where: { id: review.clientId },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ ...review, client });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.rating !== undefined) data.rating = body.rating;
  if (body.text !== undefined) data.text = body.text;
  if (body.platform !== undefined) data.platform = body.platform;
  if (body.publicReviewUrl !== undefined) data.publicReviewUrl = body.publicReviewUrl;

  // If marking COMPLETED, set completedAt timestamp
  if (body.status === "COMPLETED" && !existing.completedAt) {
    data.completedAt = new Date();
  }

  // If "resend" — refresh request token + sent timestamp
  if (body.action === "resend") {
    data.status = "REQUESTED";
    data.requestSentAt = new Date();
    data.requestToken = randomUUID();
  }

  const review = await prisma.review.update({ where: { id }, data });
  return NextResponse.json(review);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
