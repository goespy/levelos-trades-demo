import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateLeadScore } from "@/lib/scoring";
import { v4 as uuidv4 } from "uuid";
import { getCredentials, createCard, getListByName } from "@/lib/trello";
import { DEFAULT_NEW_CARD_LIST } from "@/lib/trello-constants";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { city: { contains: search } },
    ];
  }

  if (status) {
    where.designProject = { status };
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      designProject: { select: { id: true, status: true } },
      files: { select: { id: true, category: true } },
    },
    orderBy: { [sortBy]: sortOrder },
  });

  return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const prepToken = uuidv4();

  // Calculate lead score
  const score = calculateLeadScore({
    timeline: body.timeline,
    financingInterested: body.financingInterested || false,
    hasSpecificFeatures: body.hasSpecificFeatures || false,
    homeownerConfirmed: body.homeownerConfirmed || false,
    inServiceArea: body.inServiceArea ?? true,
    city: body.city,
  });

  const client = await prisma.client.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      zip: body.zip || null,
      source: body.source || null,
      trelloCardId: body.trelloCardId || null,
      timeline: body.timeline || null,
      budget: body.budget || null,
      financingInterested: body.financingInterested || false,
      hasSpecificFeatures: body.hasSpecificFeatures || false,
      homeownerConfirmed: body.homeownerConfirmed || false,
      inServiceArea: body.inServiceArea ?? true,
      notes: body.notes || null,
      leadScore: score.total,
      prepToken,
    },
    include: {
      designProject: true,
      files: true,
    },
  });

  // Optionally create a Trello card for this client
  if (body.createTrelloCard) {
    try {
      const creds = getCredentials();
      if (creds) {
        const list = await getListByName(creds, DEFAULT_NEW_CARD_LIST);
        if (list) {
          const card = await createCard(creds, list.id, client.name);
          await prisma.client.update({
            where: { id: client.id },
            data: { trelloCardId: card.id },
          });
          client.trelloCardId = card.id;
        }
      }
    } catch (err) {
      console.error("Trello card creation failed (non-blocking):", err);
    }
  }

  return NextResponse.json(client, { status: 201 });
}
