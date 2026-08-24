import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCredentials, getBoardLists, getBoardCards, getBoardLabels } from "@/lib/trello";

export async function GET() {
  const creds = getCredentials();
  if (!creds) {
    return NextResponse.json({ error: "Trello not configured" }, { status: 400 });
  }

  try {
    const [lists, cards, labels] = await Promise.all([
      getBoardLists(creds),
      getBoardCards(creds),
      getBoardLabels(creds),
    ]);

    // Fetch clients that have a trelloCardId
    const linkedClients = await prisma.client.findMany({
      where: { trelloCardId: { not: null } },
      select: {
        id: true,
        name: true,
        leadScore: true,
        trelloCardId: true,
        prepToken: true,
        prepTokenSent: true,
        prepCompleted: true,
        designProject: { select: { id: true, status: true } },
      },
    });

    // Build a map of trelloCardId → client
    const clientByCardId = new Map(
      linkedClients.map((c) => [c.trelloCardId, c])
    );

    // Enrich cards with matched client data
    const enrichedCards = cards.map((card) => ({
      ...card,
      matchedClient: clientByCardId.get(card.id) ?? null,
    }));

    return NextResponse.json({ lists, cards: enrichedCards, labels });
  } catch (err) {
    console.error("Trello board fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Trello board" },
      { status: 500 }
    );
  }
}
