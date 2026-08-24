import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCredentials, getBoardCards, getBoardLists } from "@/lib/trello";
import { TRELLO_LIST_TO_DESIGN_STATUS } from "@/lib/trello-constants";
import { v4 as uuidv4 } from "uuid";

export async function POST() {
  const creds = getCredentials();
  if (!creds) {
    return NextResponse.json({ error: "Trello not configured" }, { status: 400 });
  }

  try {
    const [lists, cards, existingClients] = await Promise.all([
      getBoardLists(creds),
      getBoardCards(creds),
      prisma.client.findMany({
        select: { id: true, name: true, trelloCardId: true },
      }),
    ]);

    // Build list id → name map
    const listNameById = new Map(lists.map((l) => [l.id, l.name]));

    // Build trelloCardId → client map
    const clientByCardId = new Map(
      existingClients.filter((c) => c.trelloCardId).map((c) => [c.trelloCardId, c])
    );
    // Unlinked clients for name matching
    const unlinkedClients = existingClients.filter((c) => !c.trelloCardId);

    let matched = 0;
    let created = 0;
    const unmatched: string[] = [];

    for (const card of cards) {
      const listName = listNameById.get(card.idList) || "";

      // Already linked to a client — skip
      if (clientByCardId.has(card.id)) continue;

      // Try name match against unlinked clients
      const cardNameLower = card.name.toLowerCase().trim();
      const matchIdx = unlinkedClients.findIndex(
        (c) => c.name.toLowerCase().trim() === cardNameLower
      );

      if (matchIdx !== -1) {
        const client = unlinkedClients[matchIdx];
        await prisma.client.update({
          where: { id: client.id },
          data: { trelloCardId: card.id },
        });
        unlinkedClients.splice(matchIdx, 1);
        clientByCardId.set(card.id, client);
        matched++;
        continue;
      }

      // Card is in "Design Phase" (or other mapped list) but has no client — auto-create
      const designStatus = TRELLO_LIST_TO_DESIGN_STATUS[listName];
      if (designStatus) {
        const prepToken = uuidv4();
        const client = await prisma.client.create({
          data: {
            name: card.name,
            source: "Trello",
            trelloCardId: card.id,
            prepToken,
          },
        });

        // Also create a DesignProject so it shows up on the designs page
        await prisma.designProject.create({
          data: {
            clientId: client.id,
            status: designStatus,
          },
        });

        clientByCardId.set(card.id, client);
        created++;
      } else {
        unmatched.push(card.name);
      }
    }

    return NextResponse.json({ matched, created, unmatched });
  } catch (err) {
    console.error("Trello sync error:", err);
    return NextResponse.json(
      { error: "Failed to sync with Trello" },
      { status: 500 }
    );
  }
}
