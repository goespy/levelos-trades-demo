import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const prismaCli = fileURLToPath(
  new URL("../node_modules/prisma/build/index.js", import.meta.url)
);

// Prisma's Windows schema engine can exit before surfacing its first SQLite
// initialization result. Native info logging keeps that startup path stable.
const env =
  process.platform === "win32"
    ? { ...process.env, RUST_LOG: "info" }
    : process.env;

const result = spawnSync(process.execPath, [prismaCli, "db", "push"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
