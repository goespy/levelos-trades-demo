import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeMargin } from "@/lib/build-calculator";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const item = await prisma.buildLineItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Line item not found" }, { status: 404 });
  }

  const quantity = body.quantity ?? item.quantity;
  const unitCost = body.unitCost ?? item.unitCost;
  const label = body.label ?? item.label;
  const total = Math.round(quantity * unitCost * 100) / 100;

  const updated = await prisma.buildLineItem.update({
    where: { id },
    data: { quantity, unitCost, total, label, isOverride: true },
  });

  // Recalc build totals
  const allItems = await prisma.buildLineItem.findMany({
    where: { buildId: item.buildId },
  });
  const totalCOGS = allItems.reduce((sum, li) => sum + (li.id === id ? total : li.total), 0);

  const build = await prisma.poolBuild.findUnique({ where: { id: item.buildId } });
  if (build) {
    const margin = analyzeMargin(totalCOGS, build.salePrice);
    await prisma.poolBuild.update({
      where: { id: item.buildId },
      data: { totalCOGS, grossProfit: margin.grossProfit, marginPct: margin.marginPct },
    });
  }

  return NextResponse.json(updated);
}
