import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateContractDefaults, mergeKnownContractFields } from "@/lib/contract-document";
import { DEMO_FIXTURES } from "@/lib/demo-fixtures";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "";
  const proposalId = searchParams.get("proposalId") || "";

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (proposalId) where.proposalId = proposalId;

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      proposal: {
        select: { id: true, clientId: true, total: true },
      },
    },
  });

  // Enrich with client names
  const clientIds = [...new Set(contracts.map((c) => c.proposal.clientId))];
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, name: true },
  });
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const enriched = contracts.map((c) => ({
    ...c,
    clientName: clientMap[c.proposal.clientId] || "Unknown",
    // Stable public-demo identifier: tours never select a record by display copy.
    demoKey: c.proposal.clientId === DEMO_FIXTURES.haywardClientId && c.status === "SIGNED" ? DEMO_FIXTURES.haywardContractKey : null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const proposal = await prisma.proposal.findUnique({
    where: { id: body.proposalId },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Get client info for contract autofill
  const client = await prisma.client.findUnique({
    where: { id: proposal.clientId },
    select: { name: true, phone: true, address: true, city: true, zip: true },
  });
  const build = await prisma.poolBuild.findUnique({ where: { id: proposal.buildId } });

  // Versioned envelope preserves the complete shared document on first render.
  const contractData = generateContractDefaults({ proposal, build: build || {}, client: client || {} });
  contractData.fields = mergeKnownContractFields(contractData.fields, body.contractData);

  const contract = await prisma.contract.create({
    data: {
      proposalId: body.proposalId,
      status: "DRAFT",
      contractData: JSON.stringify(contractData),
    },
    include: { proposal: true },
  });

  return NextResponse.json(contract, { status: 201 });
}
