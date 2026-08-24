import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const review = await prisma.review.findUnique({
    where: { requestToken: token },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const client = await prisma.client.findUnique({
    where: { id: review.clientId },
    select: { name: true },
  });

  const job = await prisma.job.findUnique({
    where: { id: review.jobId },
    select: { name: true },
  });

  return NextResponse.json({
    id: review.id,
    status: review.status,
    rating: review.rating,
    text: review.text,
    platform: review.platform,
    completedAt: review.completedAt,
    clientName: client?.name || "Customer",
    jobName: job?.name || "Your Pool",
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();

  const review = await prisma.review.findUnique({
    where: { requestToken: token },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // Don't allow re-submission
  if (review.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Review already submitted" },
      { status: 400 }
    );
  }

  const rating = Number(body.rating);
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      rating,
      text: body.text || null,
      platform: "Internal",
    },
  });

  return NextResponse.json({
    success: true,
    rating: updated.rating,
    completedAt: updated.completedAt,
  });
}
