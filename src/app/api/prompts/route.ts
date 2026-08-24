import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const prompts = await prisma.promptTemplate.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(prompts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const prompt = await prisma.promptTemplate.create({
    data: {
      name: body.name,
      template: body.template,
      category: body.category,
    },
  });

  return NextResponse.json(prompt, { status: 201 });
}
