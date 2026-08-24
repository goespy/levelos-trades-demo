import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const renders = await prisma.renderJob.findMany({
    include: {
      designProject: {
        include: {
          client: { select: { id: true, name: true } },
        },
      },
      sourceScreenshot: true,
      outputFiles: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(renders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const render = await prisma.renderJob.create({
    data: {
      designProjectId: body.designProjectId,
      promptUsed: body.promptUsed,
      sourceScreenshotId: body.sourceScreenshotId || null,
      timeOfDay: body.timeOfDay || null,
      cameraAngle: body.cameraAngle || null,
      notes: body.notes || null,
    },
    include: {
      designProject: {
        include: { client: true },
      },
      sourceScreenshot: true,
      outputFiles: true,
    },
  });

  return NextResponse.json(render, { status: 201 });
}
