import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: { contracts: true },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Enrich with client + build info
  const [client, build] = await Promise.all([
    prisma.client.findUnique({
      where: { id: proposal.clientId },
      select: { id: true, name: true, email: true, phone: true, address: true, city: true, zip: true },
    }),
    prisma.poolBuild.findUnique({
      where: { id: proposal.buildId },
      select: { id: true, name: true, totalCOGS: true, salePrice: true, marginPct: true },
    }),
  ]);

  return NextResponse.json({ ...proposal, client, build });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.proposal.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Clean up non-updatable fields
  const updateData = { ...body };
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.contracts;
  delete updateData.client;
  delete updateData.build;

  const proposal = await prisma.proposal.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(proposal);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.proposal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
