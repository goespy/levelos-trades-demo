import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { payToken: token },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Voided invoices can't be paid
  if (invoice.status === "VOID") {
    return NextResponse.json({ error: "Invoice is void" }, { status: 410 });
  }

  const [client, job] = await Promise.all([
    prisma.client.findUnique({
      where: { id: invoice.clientId },
      select: { name: true, address: true, city: true, zip: true },
    }),
    prisma.job.findUnique({
      where: { id: invoice.jobId },
      select: { name: true },
    }),
  ]);

  // Public-safe data only
  return NextResponse.json({
    number: invoice.number,
    phaseLabel: invoice.phaseLabel,
    description: invoice.description,
    amount: invoice.amount,
    status: invoice.status,
    sentAt: invoice.sentAt,
    dueDate: invoice.dueDate,
    paidAt: invoice.paidAt,
    paidAmount: invoice.paidAmount,
    paymentMethod: invoice.paymentMethod,
    clientName: client?.name || null,
    clientAddress: client
      ? [client.address, client.city, client.zip].filter(Boolean).join(", ")
      : null,
    jobName: job?.name || null,
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { payToken: token },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "VOID") {
    return NextResponse.json({ error: "Invoice is void" }, { status: 410 });
  }

  if (invoice.status === "PAID") {
    return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
  }

  // Stub Stripe checkout — instantly mark paid
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paidAmount: invoice.amount,
      paymentMethod: "STRIPE",
    },
  });

  return NextResponse.json({
    success: true,
    status: updated.status,
    paidAt: updated.paidAt,
    paidAmount: updated.paidAmount,
  });
}
