import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  const designs = await prisma.designProject.findMany({
    where,
    include: {
      client: {
        select: { id: true, name: true, email: true, phone: true, city: true },
      },
      files: { select: { id: true, category: true } },
      renderJobs: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(designs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const design = await prisma.designProject.create({
    data: {
      clientId: body.clientId,
      status: body.status || "WAITING_INFO",
      templateUsed: body.templateUsed || null,
      lotWidth: body.lotWidth || null,
      lotDepth: body.lotDepth || null,
      setbackFront: body.setbackFront || null,
      setbackSide: body.setbackSide || null,
      setbackRear: body.setbackRear || null,
      poolStyle: body.poolStyle || null,
      poolFeatures: body.poolFeatures || null,
      estimatedSize: body.estimatedSize || null,
      zoning: body.zoning || null,
      obstacles: body.obstacles || null,
      notes: body.notes || null,
    },
    include: {
      client: true,
    },
  });

  return NextResponse.json(design, { status: 201 });
}
