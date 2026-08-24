import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isPublicDemo } from "@/lib/public-demo";
import {
  DEMO_SESSION_SUBJECT,
  getSessionConfig,
  makeSessionToken,
  SESSION_COOKIE,
} from "@/lib/session";

export async function POST() {
  if (!isPublicDemo()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sessionConfig = getSessionConfig();
  if (!sessionConfig) {
    return NextResponse.json(
      { error: "Demo session is not configured." },
      { status: 503 }
    );
  }

  const token = await makeSessionToken(
    DEMO_SESSION_SUBJECT,
    sessionConfig.sessionSecret
  );
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return NextResponse.json({ success: true });
}
