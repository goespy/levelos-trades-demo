import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { proposal: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Enrich with client info
  const client = await prisma.client.findUnique({
    where: { id: contract.proposal.clientId },
    select: { id: true, name: true, email: true, phone: true, address: true, city: true, zip: true },
  });

  return NextResponse.json({ ...contract, client });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  if (existing.status === "SIGNED") {
    return NextResponse.json({ error: "Signed contracts are immutable" }, { status: 409 });
  }

  const updateData = { ...body };
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.proposal;
  delete updateData.client;
  const allowed = new Set(["status", "contractData"]);
  for (const key of Object.keys(updateData)) if (!allowed.has(key)) delete updateData[key];
  if (updateData.status && !["DRAFT", "SENT", "VOID"].includes(updateData.status)) {
    return NextResponse.json({ error: "Invalid contract status transition" }, { status: 400 });
  }
  if (existing.status === "SENT" && updateData.status === "DRAFT") {
    return NextResponse.json({ error: "Sent contracts cannot return to draft" }, { status: 409 });
  }

  const contract = await prisma.contract.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(contract);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (existing.status === "SIGNED") return NextResponse.json({ error: "Signed contracts cannot be deleted" }, { status: 409 });

  await prisma.contract.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
