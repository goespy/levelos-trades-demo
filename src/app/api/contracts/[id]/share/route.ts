import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Reuse existing token or generate a new one
  const shareToken = contract.shareToken || randomUUID();

  await prisma.contract.update({
    where: { id },
    data: {
      shareToken,
      sharedAt: new Date(),
      status: contract.status === "DRAFT" ? "SENT" : contract.status,
    },
  });

  return NextResponse.json({ url: `/c/${shareToken}`, token: shareToken });
}
