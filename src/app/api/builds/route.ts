import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateBuild, analyzeMargin } from "@/lib/build-calculator";
import type { BuildInput } from "@/lib/build-calculator";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.name = { contains: search };
  }

  if (status) {
    where.status = status;
  }

  const builds = await prisma.poolBuild.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      lineItems: { select: { id: true } },
    },
  });

  return NextResponse.json(builds);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const input: BuildInput = {
    poolLength: body.poolLength,
    poolWidth: body.poolWidth,
    deckLength: body.deckLength,
    deckWidth: body.deckWidth,
    hasSpa: body.hasSpa || false,
    hasHeat: body.hasHeat || false,
    hasAutomation: body.hasAutomation || false,
    isSalt: body.isSalt || false,
    hasCage: body.hasCage || false,
    hasWaterfall: body.hasWaterfall || false,
    hasSod: body.hasSod || false,
    hasTreeRemoval: body.hasTreeRemoval || false,
    hasFireFeatures: body.hasFireFeatures || false,
    hasInteriorUpgrade: body.hasInteriorUpgrade || false,
    deckMaterial: body.deckMaterial || "PAVER",
    equipment: body.equipment || "BASE",
    spaCost: body.spaCost || 0,
    heatCost: body.heatCost || 0,
    sodCost: body.sodCost || 0,
    cageCost: body.cageCost || 0,
    waterfallCost: body.waterfallCost || 0,
    treeRemovalCost: body.treeRemovalCost || 0,
    fireFeaturesCost: body.fireFeaturesCost || 0,
    interiorUpgradeCost: body.interiorUpgradeCost || 0,
    deckAreaOverride: body.deckAreaOverride || null,
  };

  const breakdown = calculateBuild(input);
  const salePrice = body.salePrice || 0;
  const margin = analyzeMargin(breakdown.totalCOGS, salePrice);

  let build;
  try {
  build = await prisma.poolBuild.create({
    data: {
      name: body.name,
      status: body.status || "DRAFT",
      clientId: body.clientId || null,
      poolLength: input.poolLength,
      poolWidth: input.poolWidth,
      deckLength: input.deckLength,
      deckWidth: input.deckWidth,
      hasSpa: input.hasSpa,
      hasHeat: input.hasHeat,
      hasAutomation: input.hasAutomation,
      isSalt: input.isSalt,
      hasCage: input.hasCage,
      hasWaterfall: input.hasWaterfall,
      hasSod: input.hasSod,
      hasTreeRemoval: input.hasTreeRemoval,
      hasFireFeatures: input.hasFireFeatures,
      hasInteriorUpgrade: input.hasInteriorUpgrade,
      deckMaterial: input.deckMaterial,
      equipment: input.equipment,
      spaCost: input.spaCost,
      heatCost: input.heatCost,
      sodCost: input.sodCost,
      cageCost: input.cageCost,
      waterfallCost: input.waterfallCost,
      treeRemovalCost: input.treeRemovalCost,
      fireFeaturesCost: input.fireFeaturesCost,
      interiorUpgradeCost: input.interiorUpgradeCost,
      deckAreaOverride: input.deckAreaOverride,
      deckVertices: body.deckVertices || null,
      totalCOGS: breakdown.totalCOGS,
      salePrice,
      grossProfit: margin.grossProfit,
      marginPct: margin.marginPct,
      notes: body.notes || null,
      lineItems: {
        create: breakdown.lineItems.map((item) => ({
          phase: item.phase,
          label: item.label,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          total: item.total,
          sortOrder: item.sortOrder,
        })),
      },
    },
    include: { lineItems: true },
  });
  } catch (e: unknown) {
    console.error("Build create error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json(build, { status: 201 });
}
