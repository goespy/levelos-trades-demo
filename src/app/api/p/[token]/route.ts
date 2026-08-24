import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCredentials, addCommentToCard } from "@/lib/trello";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { shareToken: token },
  });

  if (!proposal) {
    return NextResponse.json(
      { error: "Proposal not found" },
      { status: 404 }
    );
  }

  // Fetch client info (safe fields only)
  const client = await prisma.client.findUnique({
    where: { id: proposal.clientId },
    select: { name: true, address: true, city: true, zip: true },
  });

  // Return client-safe data only (no COGS, margins, buildId, lineItems)
  return NextResponse.json({
    id: proposal.id,
    status: proposal.status,
    total: proposal.total,
    discount: proposal.discount,
    heroHeadline: proposal.heroHeadline,
    heroSubheadline: proposal.heroSubheadline,
    approachText: proposal.approachText,
    featureCards: proposal.featureCards,
    milestones: proposal.milestones,
    renderImages: proposal.renderImages,
    validUntil: proposal.validUntil,
    clientRespondedAt: proposal.clientRespondedAt,
    clientMessage: proposal.clientMessage,
    clientName: client?.name || null,
    clientAddress: client
      ? [client.address, client.city, client.zip].filter(Boolean).join(", ")
      : null,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();

  const proposal = await prisma.proposal.findUnique({
    where: { shareToken: token },
  });

  if (!proposal) {
    return NextResponse.json(
      { error: "Proposal not found" },
      { status: 404 }
    );
  }

  // Don't allow re-response
  if (proposal.clientRespondedAt) {
    return NextResponse.json(
      { error: "Already responded" },
      { status: 400 }
    );
  }

  // Fetch client for Trello notification
  const client = await prisma.client.findUnique({
    where: { id: proposal.clientId },
    select: { name: true, trelloCardId: true },
  });

  const total = proposal.total - proposal.discount;
  const fmtTotal = "$" + total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (body.action === "approve") {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: "ACCEPTED",
        clientRespondedAt: new Date(),
      },
    });

    // Notify Trello
    const creds = getCredentials();
    if (creds && client?.trelloCardId) {
      try {
        await addCommentToCard(
          creds,
          client.trelloCardId,
          `✅ PROPOSAL APPROVED\n\n${client.name} approved their ${fmtTotal} proposal.`
        );
      } catch {
        // Don't fail the response if Trello notification fails
      }
    }

    return NextResponse.json({ success: true, status: "ACCEPTED" });
  }

  if (body.action === "request_changes") {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: "REJECTED",
        clientRespondedAt: new Date(),
        clientMessage: body.message || null,
      },
    });

    // Notify Trello
    const creds = getCredentials();
    if (creds && client?.trelloCardId) {
      try {
        await addCommentToCard(
          creds,
          client.trelloCardId,
          `📝 CHANGES REQUESTED\n\n${client.name} requested changes on their ${fmtTotal} proposal.\n\nMessage: "${body.message || "(no message)"}"`
        );
      } catch {
        // Don't fail the response if Trello notification fails
      }
    }

    return NextResponse.json({ success: true, status: "REJECTED" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
