import { NextRequest, NextResponse } from "next/server";
import { getCredentials, getCardChecklists, moveCard } from "@/lib/trello";
import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { calculateLeadScore } from "@/lib/scoring";
import { QUALIFYING_CALL_LIST } from "@/lib/trello-constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const creds = getCredentials();
  if (!creds) {
    return NextResponse.json({ error: "Trello not configured" }, { status: 400 });
  }

  try {
    const checklists = await getCardChecklists(creds, cardId);
    return NextResponse.json(checklists);
  } catch (err) {
    console.error("Trello checklist fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch checklists" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const creds = getCredentials();
  if (!creds) {
    return NextResponse.json({ error: "Trello not configured" }, { status: 400 });
  }

  const body = await request.json();
  const { listId, listName } = body;

  if (!listId) {
    return NextResponse.json({ error: "listId is required" }, { status: 400 });
  }

  try {
    const card = await moveCard(creds, cardId, listId);

    let clientCreated = false;

    // Auto-create client when moved to Qualifying Call
    if (listName === QUALIFYING_CALL_LIST) {
      const existing = await prisma.client.findFirst({
        where: { trelloCardId: cardId },
      });

      if (!existing) {
        const score = calculateLeadScore({
          financingInterested: false,
          hasSpecificFeatures: false,
          homeownerConfirmed: false,
          inServiceArea: true,
        });

        await prisma.client.create({
          data: {
            name: card.name,
            trelloCardId: cardId,
            prepToken: uuidv4(),
            leadScore: score.total,
          },
        });
        clientCreated = true;
      }
    }

    return NextResponse.json({ ...card, clientCreated });
  } catch (err) {
    console.error("Trello card move error:", err);
    return NextResponse.json(
      { error: "Failed to move card" },
      { status: 500 }
    );
  }
}
