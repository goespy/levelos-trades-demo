import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateLeadScore } from "@/lib/scoring";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      designProject: {
        include: {
          renderJobs: true,
        },
      },
      files: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Recalculate lead score if relevant fields changed
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const merged = { ...existing, ...body };
  const score = calculateLeadScore({
    timeline: merged.timeline,
    financingInterested: merged.financingInterested,
    hasSpecificFeatures: merged.hasSpecificFeatures,
    homeownerConfirmed: merged.homeownerConfirmed,
    inServiceArea: merged.inServiceArea,
    city: merged.city,
    prepCompleted: merged.prepCompleted,
    prepTokenSent: merged.prepTokenSent,
  });

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...body,
      leadScore: score.total,
    },
    include: {
      designProject: true,
      files: true,
    },
  });

  return NextResponse.json(client);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Require admin PIN to delete clients
  const { pin } = await request.json().catch(() => ({ pin: "" }));
  const adminPin = process.env.ADMIN_DELETE_PIN || "2311";

  if (pin !== adminPin) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 403 });
  }

  await prisma.client.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
