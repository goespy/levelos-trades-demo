import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateBuild, analyzeMargin } from "@/lib/build-calculator";
import type { BuildInput } from "@/lib/build-calculator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const build = await prisma.poolBuild.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }

  return NextResponse.json(build);
}

// Fields that trigger a recalculation
const CALC_FIELDS = [
  "poolLength",
  "poolWidth",
  "deckLength",
  "deckWidth",
  "deckAreaOverride",
  "hasSpa",
  "hasHeat",
  "hasAutomation",
  "isSalt",
  "hasCage",
  "hasWaterfall",
  "hasSod",
  "deckMaterial",
  "equipment",
  "spaCost",
  "heatCost",
  "sodCost",
  "cageCost",
  "waterfallCost",
  "hasTreeRemoval",
  "hasFireFeatures",
  "hasInteriorUpgrade",
  "treeRemovalCost",
  "fireFeaturesCost",
  "interiorUpgradeCost",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.poolBuild.findUnique({
    where: { id },
    include: { lineItems: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }

  const merged = { ...existing, ...body };
  const needsRecalc = CALC_FIELDS.some(
    (f) => f in body && body[f] !== (existing as Record<string, unknown>)[f]
  );

  let updateData: Record<string, unknown> = { ...body };

  if (needsRecalc) {
    const input: BuildInput = {
      poolLength: merged.poolLength,
      poolWidth: merged.poolWidth,
      deckLength: merged.deckLength,
      deckWidth: merged.deckWidth,
      deckAreaOverride: merged.deckAreaOverride,
      hasSpa: merged.hasSpa,
      hasHeat: merged.hasHeat,
      hasAutomation: merged.hasAutomation,
      isSalt: merged.isSalt,
      hasCage: merged.hasCage,
      hasWaterfall: merged.hasWaterfall,
      hasSod: merged.hasSod,
      hasTreeRemoval: merged.hasTreeRemoval,
      hasFireFeatures: merged.hasFireFeatures,
      hasInteriorUpgrade: merged.hasInteriorUpgrade,
      deckMaterial: merged.deckMaterial,
      equipment: merged.equipment,
      spaCost: merged.spaCost,
      heatCost: merged.heatCost,
      sodCost: merged.sodCost,
      cageCost: merged.cageCost,
      waterfallCost: merged.waterfallCost,
      treeRemovalCost: merged.treeRemovalCost,
      fireFeaturesCost: merged.fireFeaturesCost,
      interiorUpgradeCost: merged.interiorUpgradeCost,
    };

    const breakdown = calculateBuild(input);
    // Delete non-override line items and regenerate
    await prisma.buildLineItem.deleteMany({
      where: { buildId: id, isOverride: false },
    });

    await prisma.buildLineItem.createMany({
      data: breakdown.lineItems.map((item) => ({
        buildId: id,
        phase: item.phase,
        label: item.label,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: item.unitCost,
        total: item.total,
        sortOrder: item.sortOrder,
      })),
    });

    // Recalculate totals including overrides
    const overrides = existing.lineItems.filter((li) => li.isOverride);
    const overrideTotal = overrides.reduce((sum, li) => sum + li.total, 0);
    const totalCOGS = breakdown.totalCOGS + overrideTotal;
    const finalMargin = analyzeMargin(totalCOGS, merged.salePrice);

    updateData = {
      ...updateData,
      totalCOGS,
      grossProfit: finalMargin.grossProfit,
      marginPct: finalMargin.marginPct,
    };

    // Remove lineItems from update data (handled separately)
    delete updateData.lineItems;
  } else if ("salePrice" in body) {
    // Just recalc margin if only sale price changed
    const margin = analyzeMargin(merged.totalCOGS, merged.salePrice);
    updateData.grossProfit = margin.grossProfit;
    updateData.marginPct = margin.marginPct;
  }

  // Remove fields that shouldn't be directly updated
  delete updateData.id;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.lineItems;

  let build;
  try {
    build = await prisma.poolBuild.update({
      where: { id },
      data: updateData,
      include: {
        lineItems: { orderBy: { sortOrder: "asc" } },
      },
    });
  } catch (e: unknown) {
    console.error("Build update error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json(build);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.poolBuild.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
