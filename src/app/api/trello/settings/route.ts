import { NextRequest, NextResponse } from "next/server";
import { getCredentials, testConnection } from "@/lib/trello";
import { isPublicDemo, PUBLIC_DEMO_MESSAGE } from "@/lib/public-demo";

export async function GET() {
  const creds = getCredentials();
  return NextResponse.json({
    configured: creds !== null,
    publicDemo: isPublicDemo(),
  });
}

export async function PUT(request: NextRequest) {
  if (isPublicDemo()) {
    return NextResponse.json({ error: PUBLIC_DEMO_MESSAGE }, { status: 403 });
  }

  const body = await request.json();
  const { apiKey, token, boardId } = body;

  if (!apiKey || !token || !boardId) {
    return NextResponse.json(
      { error: "apiKey, token, and boardId are required" },
      { status: 400 }
    );
  }

  const result = await testConnection({ apiKey, token, boardId });
  return NextResponse.json(result);
}
