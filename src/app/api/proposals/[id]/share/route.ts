import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Reuse existing token or generate a new one
  const shareToken = proposal.shareToken || randomUUID();

  await prisma.proposal.update({
    where: { id },
    data: {
      shareToken,
      sharedAt: new Date(),
      status: proposal.status === "DRAFT" ? "SENT" : proposal.status,
    },
  });

  return NextResponse.json({ url: `/p/${shareToken}`, token: shareToken });
}
