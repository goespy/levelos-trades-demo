import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateProposalDefaults } from "@/lib/proposal-defaults";
import { DEMO_PROPOSAL_RENDER_IMAGES } from "@/lib/proposal-demo-assets";
import { isPublicDemo } from "@/lib/public-demo";
import { DEMO_FIXTURES } from "@/lib/demo-fixtures";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "";
  const clientId = searchParams.get("clientId") || "";
  const buildId = searchParams.get("buildId") || "";

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (buildId) where.buildId = buildId;

  const proposals = await prisma.proposal.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  // Enrich with client + build names
  const clientIds = [...new Set(proposals.map((p) => p.clientId))];
  const buildIds = [...new Set(proposals.map((p) => p.buildId))];

  const [clients, builds] = await Promise.all([
    prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true },
    }),
    prisma.poolBuild.findMany({
      where: { id: { in: buildIds } },
      select: { id: true, name: true },
    }),
  ]);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const buildMap = Object.fromEntries(builds.map((b) => [b.id, b.name]));

  const enriched = proposals.map((p) => ({
    ...p,
    clientName: clientMap[p.clientId] || "Unknown",
    buildName: buildMap[p.buildId] || "Unknown",
    demoKey: p.clientId === DEMO_FIXTURES.haywardClientId ? DEMO_FIXTURES.haywardProposalKey : null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.clientId || !body.buildId) {
      return NextResponse.json(
        { error: `Missing required field(s): ${!body.clientId ? "clientId " : ""}${!body.buildId ? "buildId" : ""}`.trim() },
        { status: 400 }
      );
    }

    const build = await prisma.poolBuild.findUnique({
      where: { id: body.buildId },
      include: { lineItems: { orderBy: { sortOrder: "asc" } } },
    });

    if (!build) {
      return NextResponse.json({ error: `Build not found: ${body.buildId}` }, { status: 404 });
    }

    const lineItemsSnapshot = build.lineItems.map((li) => ({
      phase: li.phase,
      label: li.label,
      quantity: li.quantity,
      unit: li.unit,
      unitCost: li.unitCost,
      total: li.total,
    }));

    const defaults = generateProposalDefaults(build, lineItemsSnapshot);

    const renderImages: string[] = [];
    const client = await prisma.client.findUnique({
      where: { id: body.clientId },
      include: {
        designProject: {
          include: {
            renderJobs: {
              where: { selected: true },
              include: { outputFiles: true },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: `Client not found: ${body.clientId}` }, { status: 404 });
    }

    if (client.designProject?.renderJobs) {
      for (const job of client.designProject.renderJobs) {
        for (const file of job.outputFiles) {
          renderImages.push(file.storagePath);
        }
      }
    }

    if (isPublicDemo() && renderImages.length === 0) {
      renderImages.push(...DEMO_PROPOSAL_RENDER_IMAGES);
    }

    const proposal = await prisma.proposal.create({
      data: {
        clientId: body.clientId,
        buildId: body.buildId,
        status: "DRAFT",
        total: build.salePrice || build.totalCOGS,
        discount: body.discount || 0,
        poolLength: build.poolLength,
        poolWidth: build.poolWidth,
        deckMaterial: build.deckMaterial,
        lineItems: JSON.stringify(lineItemsSnapshot),
        notes: body.notes || null,
        exclusions: body.exclusions || null,
        renderImages: renderImages.length > 0 ? JSON.stringify(renderImages) : null,
        heroHeadline: defaults.heroHeadline,
        heroSubheadline: defaults.heroSubheadline,
        approachText: defaults.approachText,
        featureCards: JSON.stringify(defaults.featureCards),
        milestones: JSON.stringify(defaults.milestones),
        validUntil: defaults.validUntil,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (err) {
    console.error("POST /api/proposals failed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}
