export const SESSION_COOKIE = "pb_session";
export const DEMO_SESSION_SUBJECT = "public-portfolio-demo";

interface SessionConfig {
  sessionSecret: string;
}

export function getSessionConfig(): SessionConfig | null {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret || sessionSecret.length < 32) {
    return null;
  }

  return { sessionSecret };
}

export async function makeSessionToken(
  username: string,
  sessionSecret: string
): Promise<string> {
  const data = new TextEncoder().encode(`${username}:${sessionSecret}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
