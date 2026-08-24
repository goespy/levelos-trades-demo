import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCredentials, createCard } from "@/lib/trello";

export async function POST(request: NextRequest) {
  const creds = getCredentials();
  if (!creds) {
    return NextResponse.json({ error: "Trello not configured" }, { status: 400 });
  }

  const body = await request.json();
  const { listId, name, desc, clientId } = body;

  if (!listId || !name) {
    return NextResponse.json({ error: "listId and name are required" }, { status: 400 });
  }

  try {
    const card = await createCard(creds, listId, name, desc);

    // If a clientId was provided, link the card to the client
    if (clientId) {
      await prisma.client.update({
        where: { id: clientId },
        data: { trelloCardId: card.id },
      });
    }

    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    console.error("Trello card creation error:", err);
    return NextResponse.json(
      { error: "Failed to create Trello card" },
      { status: 500 }
    );
  }
}
