import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const templatePath = fileURLToPath(
  new URL("../prisma/demo-template.db", import.meta.url)
);
const prismaCli = fileURLToPath(
  new URL("../node_modules/prisma/build/index.js", import.meta.url)
);
const tsxCli = fileURLToPath(
  new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url)
);

if (existsSync(templatePath)) {
  rmSync(templatePath);
}

const databaseUrl = "file:prisma/demo-template.db";
const commonEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  SEED_DATABASE_URL: databaseUrl,
  ...(process.platform === "win32" ? { RUST_LOG: "info" } : {}),
};

const push = spawnSync(
  process.execPath,
  [prismaCli, "db", "push"],
  { cwd: projectRoot, env: commonEnv, stdio: "inherit" }
);

if (push.status !== 0) {
  process.exit(push.status ?? 1);
}

const seed = spawnSync(
  process.execPath,
  [tsxCli, "scripts/seed-demo.ts"],
  { cwd: projectRoot, env: commonEnv, stdio: "inherit" }
);

process.exit(seed.status ?? 1);
