import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCredentials, moveCard, getListByName } from "@/lib/trello";
import { DESIGN_STATUS_TO_TRELLO_LIST } from "@/lib/trello-constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const design = await prisma.designProject.findUnique({
    where: { id },
    include: {
      client: true,
      files: { orderBy: { createdAt: "desc" } },
      renderJobs: {
        include: {
          sourceScreenshot: true,
          outputFiles: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  return NextResponse.json(design);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Auto-set timestamps based on status changes
  const existing = await prisma.designProject.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = { ...body };

  if (body.status === "IN_PROGRESS" && !existing.designStarted) {
    data.designStarted = new Date();
  }
  if (body.status === "COMPLETE" && !existing.designCompleted) {
    data.designCompleted = new Date();
  }
  if (body.status === "COMPLETE" && !existing.rendersCompleted) {
    data.rendersCompleted = new Date();
  }

  const design = await prisma.designProject.update({
    where: { id },
    data,
    include: {
      client: true,
      files: true,
      renderJobs: true,
    },
  });

  // If design status changed, move linked Trello card to mapped list
  if (body.status && design.client?.trelloCardId) {
    const targetListName = DESIGN_STATUS_TO_TRELLO_LIST[body.status];
    if (targetListName) {
      try {
        const creds = getCredentials();
        if (creds) {
          const targetList = await getListByName(creds, targetListName);
          if (targetList) {
            await moveCard(creds, design.client.trelloCardId, targetList.id);
          }
        }
      } catch (err) {
        console.error("Trello card move failed (non-blocking):", err);
      }
    }
  }

  return NextResponse.json(design);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.designProject.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
