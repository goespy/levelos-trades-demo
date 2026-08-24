import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { prepToken: token },
    select: {
      id: true,
      name: true,
      prepCompleted: true,
      files: {
        where: {
          category: { in: ["SURVEY", "BACKYARD_PHOTO"] },
        },
        select: {
          id: true,
          category: true,
          angle: true,
          filename: true,
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { prepToken: token },
  });

  if (!client) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  // Mark prep as completed
  await prisma.client.update({
    where: { id: client.id },
    data: { prepCompleted: new Date() },
  });

  // Update design project if exists
  const designProject = await prisma.designProject.findUnique({
    where: { clientId: client.id },
  });

  if (designProject) {
    const files = await prisma.clientFile.findMany({
      where: { clientId: client.id },
    });

    const hasSurvey = files.some((f) => f.category === "SURVEY");
    const photoCount = files.filter(
      (f) => f.category === "BACKYARD_PHOTO"
    ).length;

    await prisma.designProject.update({
      where: { id: designProject.id },
      data: {
        surveyReceived: hasSurvey,
        photosReceived: photoCount >= 4,
        surveyDate: hasSurvey ? new Date() : undefined,
        photosDate: photoCount >= 4 ? new Date() : undefined,
        status:
          hasSurvey && photoCount >= 4 ? "READY_TO_DESIGN" : "WAITING_INFO",
      },
    });
  }

  return NextResponse.json({ success: true });
}
