import { NextRequest, NextResponse } from "next/server";
import {
  DEMO_SESSION_SUBJECT,
  getSessionConfig,
  makeSessionToken,
  SESSION_COOKIE,
} from "@/lib/session";

const PUBLIC_ROUTE_PREFIXES = [
  "/demo",
  "/p/",
  "/prep/",
  "/api/auth/",
  "/api/p/",
  "/api/prep/",
  "/c/",
  "/api/c/",
  "/j/",
  "/api/j/",
  "/pay/",
  "/api/pay/",
  "/review/",
  "/api/review/",
  "/_next/",
  "/images/",
  "/favicon",
  "/sw.js",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/demo", request.url));
  }

  if (PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const sessionConfig = getSessionConfig();
  if (!sessionConfig) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Demo session is not configured." },
        { status: 503 }
      );
    }

    const demoUrl = new URL("/demo", request.url);
    demoUrl.searchParams.set("setup", "required");
    return NextResponse.redirect(demoUrl);
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const expectedToken = await makeSessionToken(
    DEMO_SESSION_SUBJECT,
    sessionConfig.sessionSecret
  );

  if (session === expectedToken) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/demo", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
