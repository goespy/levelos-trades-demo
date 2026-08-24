import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const [client, job] = await Promise.all([
    prisma.client.findUnique({
      where: { id: invoice.clientId },
      select: { id: true, name: true, email: true, phone: true, address: true, city: true, zip: true },
    }),
    prisma.job.findUnique({
      where: { id: invoice.jobId },
      select: { id: true, name: true, status: true },
    }),
  ]);

  return NextResponse.json({ ...invoice, client, job });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  const allowed = [
    "phaseLabel",
    "amount",
    "description",
    "status",
    "dueDate",
    "paidAt",
    "paidAmount",
    "paymentMethod",
    "notes",
    "sentAt",
  ];
  for (const k of allowed) {
    if (k in body) {
      if ((k === "dueDate" || k === "paidAt" || k === "sentAt") && body[k]) {
        updateData[k] = new Date(body[k]);
      } else {
        updateData[k] = body[k];
      }
    }
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(invoice);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
