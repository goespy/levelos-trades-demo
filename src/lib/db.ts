import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (tursoUrl && tursoToken) {
    const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
    return new PrismaClient({ adapter });
  }

  if (process.env.HOSTED_DEMO === "true") {
    const templatePath = join(process.cwd(), "prisma", "demo-template.db");
    const templateHash = createHash("sha256")
      .update(readFileSync(templatePath))
      .digest("hex")
      .slice(0, 12);
    const runtimePath = join(
      tmpdir(),
      `levelos-trades-demo-${templateHash}.db`
    );

    if (!existsSync(runtimePath)) {
      copyFileSync(templatePath, runtimePath);
    }

    const adapter = new PrismaLibSql({ url: `file:${runtimePath}` });
    return new PrismaClient({ adapter });
  }

  // Local development fallback
  const adapter = new PrismaLibSql({ url: "file:dev.db" });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
