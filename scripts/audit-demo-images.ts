import { createHash } from "node:crypto";
import {
  readFileSync,
  readdirSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { createClient } from "@libsql/client";
import { DEMO_PROPOSAL_RENDER_IMAGES } from "../src/lib/proposal-demo-assets";

// Each hash was recorded only after visually confirming that the asset depicts
// a pool. Changing a bundled visual requires another manual review and a hash
// update here.
const VERIFIED_POOL_MEDIA: Record<string, string> = {
  "images/proposal-hero.avif":
    "36470c009f7d84c66955dc42be25ac6a33461e0c8d49739f23e92785c9c1a2e6",
  "images/proposal-hero.mp4":
    "36c31fbb6e6613fc4012c3dd15115e4ec0060c1b55037da22733ab9953f7772f",
  "images/proposal-renders/modern-geometric-day.webp":
    "57236f233c852a1824a538e1eeacf7d8c6c5cbf981de1e0e389e1e59fcc5fde5",
  "images/proposal-renders/modern-geometric-golden-hour.webp":
    "ccbf7e530783e160268270c3ce6e230de2ce8460613d32047a05992769689377",
  "images/proposal-renders/modern-geometric-dusk.webp":
    "7afb4e8ce43fbbb58130608eefd16a810016aa7cd049de50e0a1618cf4984d6e",
};

const MEDIA_EXTENSION = /\.(?:avif|gif|jpe?g|mp4|png|svg|webm|webp)$/i;
const SOURCE_EXTENSION = /\.(?:js|mjs|prisma|ts|tsx)$/i;
const REMOTE_IMAGE =
  /https?:\/\/(?:images\.unsplash\.com|[^\s"'`)]+\.(?:avif|gif|jpe?g|png|svg|webp))(?:[^\s"'`)]*)?/gi;

function walk(root: string, matcher: RegExp): string[] {
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && matcher.test(entry.name)) files.push(path);
    }
  };
  visit(root);
  return files;
}

function normalizedRelative(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

function parsePaths(value: unknown, source: string): string[] {
  if (value == null) return [];
  try {
    const parsed = JSON.parse(String(value));
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error("expected an array of strings");
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid image list in ${source}: ${String(error)}`);
  }
}

async function main() {
  const failures: string[] = [];
  const publicRoot = resolve("public");
  const discoveredMedia = walk(publicRoot, MEDIA_EXTENSION).map((path) =>
    normalizedRelative(publicRoot, path)
  );
  const verifiedPaths = new Set(Object.keys(VERIFIED_POOL_MEDIA));

  for (const path of discoveredMedia) {
    if (!verifiedPaths.has(path)) {
      failures.push(`Unreviewed public media: public/${path}`);
      continue;
    }
    const actual = createHash("sha256")
      .update(readFileSync(join(publicRoot, path)))
      .digest("hex");
    if (actual !== VERIFIED_POOL_MEDIA[path]) {
      failures.push(`Verified pool asset changed: public/${path}`);
    }
  }

  for (const path of verifiedPaths) {
    if (!discoveredMedia.includes(path)) {
      failures.push(`Verified pool asset is missing: public/${path}`);
    }
  }

  for (const sourceRoot of [resolve("src"), resolve("scripts"), resolve("prisma")]) {
    for (const path of walk(sourceRoot, SOURCE_EXTENSION)) {
      const matches = readFileSync(path, "utf8").match(REMOTE_IMAGE) || [];
      for (const match of matches) {
        failures.push(
          `Remote image reference in ${normalizedRelative(resolve(), path)}: ${match}`
        );
      }
    }
  }

  const allowedDatabasePaths = new Set(DEMO_PROPOSAL_RENDER_IMAGES);
  const database = createClient({
    url: process.env.IMAGE_AUDIT_DATABASE_URL || "file:prisma/demo-template.db",
  });

  const databaseImagePaths: Array<{ source: string; path: string }> = [];
  const clientFiles = await database.execute(
    "SELECT filename, storagePath FROM ClientFile WHERE fileType LIKE 'image/%'"
  );
  for (const row of clientFiles.rows) {
    databaseImagePaths.push({
      source: `ClientFile ${String(row.filename)}`,
      path: String(row.storagePath),
    });
  }

  for (const [table, column] of [
    ["JobPhase", "photos"],
    ["Proposal", "renderImages"],
  ] as const) {
    const rows = await database.execute(
      `SELECT id, ${column} AS value FROM ${table} WHERE ${column} IS NOT NULL`
    );
    for (const row of rows.rows) {
      for (const path of parsePaths(row.value, `${table} ${String(row.id)}`)) {
        databaseImagePaths.push({ source: `${table} ${String(row.id)}`, path });
      }
    }
  }
  await database.close();

  for (const image of databaseImagePaths) {
    if (!allowedDatabasePaths.has(image.path)) {
      failures.push(`Unapproved demo image in ${image.source}: ${image.path}`);
    }
  }

  if (failures.length > 0) {
    console.error("Demo image audit failed:\n");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(
    `Demo image audit passed: ${discoveredMedia.length} verified pool media assets and ${databaseImagePaths.length} database references.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
