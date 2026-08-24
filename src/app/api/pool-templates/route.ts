import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const templates = await prisma.poolTemplate.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const template = await prisma.poolTemplate.create({
    data: {
      name: body.name,
      description: body.description,
      bestFor: body.bestFor,
      shape: body.shape || null,
      features: body.features ? JSON.stringify(body.features) : null,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
