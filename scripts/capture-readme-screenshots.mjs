import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createClient } from "@libsql/client";

const baseUrl = process.env.CAPTURE_BASE_URL || "http://localhost:3000";

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));

if (!chromePath) {
  throw new Error("Chrome was not found. Set CHROME_PATH and try again.");
}

const database = createClient({ url: "file:prisma/demo-template.db" });
const hayward = await database.execute({
  sql: "SELECT id FROM Client WHERE name = ? LIMIT 1",
  args: ["Robert & Lisa Hayward"],
});
const haywardBuild = await database.execute({
  sql: "SELECT id FROM PoolBuild WHERE name LIKE ? LIMIT 1",
  args: ["Hayward%"],
});
const haywardProposal = await database.execute({
  sql: "SELECT id, shareToken FROM Proposal WHERE clientId = ? AND shareToken IS NOT NULL LIMIT 1",
  args: [String(hayward.rows[0]?.id || "")],
});
const haywardDesign = await database.execute({
  sql: "SELECT id FROM DesignProject WHERE clientId = ? LIMIT 1",
  args: [String(hayward.rows[0]?.id || "")],
});
const haywardJob = await database.execute({
  sql: "SELECT portalToken FROM Job WHERE clientId = ? AND portalToken IS NOT NULL LIMIT 1",
  args: [String(hayward.rows[0]?.id || "")],
});
await database.close();

const clientId = String(hayward.rows[0]?.id || "");
const buildId = String(haywardBuild.rows[0]?.id || "");
const proposalId = String(haywardProposal.rows[0]?.id || "");
const designId = String(haywardDesign.rows[0]?.id || "");
const portalToken = String(haywardJob.rows[0]?.portalToken || "");

if (!clientId || !buildId || !proposalId || !designId || !portalToken) {
  throw new Error("The expected Hayward demo records were not found.");
}

const readmeCaptures = [
  { name: "dashboard", path: "/", expectedText: "Overview" },
  {
    name: "client-workspace",
    path: `/clients/${clientId}`,
    expectedText: "Robert & Lisa Hayward",
  },
  {
    name: "build-estimate",
    path: `/builds/${buildId}`,
    expectedText: "Hayward — Modern Geometric",
  },
  {
    name: "proposal",
    path: `/proposals/${proposalId}/template`,
    expectedText: "Template Editor",
    previewText: "Your Dream Pool Awaits",
  },
  { name: "job-operations", path: "/jobs", expectedText: "ACTIVE JOBS PHASE MAP" },
];
const imageAuditCaptures = [
  {
    name: "design-images-audit",
    path: `/designs/${designId}`,
    expectedText: "Design: Robert & Lisa Hayward",
  },
  { name: "render-images-audit", path: "/renders", expectedText: "Render Jobs" },
  {
    name: "customer-gallery-audit",
    path: `/j/${portalToken}`,
    expectedText: "BUILD PHOTOS",
  },
];
const captures =
  process.env.CAPTURE_IMAGE_AUDIT === "true"
    ? imageAuditCaptures
    : readmeCaptures;

const outputDir = process.env.CAPTURE_OUTPUT_DIR
  ? resolve(process.env.CAPTURE_OUTPUT_DIR)
  : resolve("docs", "screenshots");
mkdirSync(outputDir, { recursive: true });

const profileDir = mkdtempSync(join(tmpdir(), "levelos-trades-capture-"));
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"], windowsHide: true }
);

const browserWebSocket = await new Promise((resolveWebSocket, reject) => {
  let stderr = "";
  const timeout = setTimeout(
    () => reject(new Error(`Chrome did not start in time. ${stderr}`)),
    15000
  );

  chrome.stderr.setEncoding("utf8");
  chrome.stderr.on("data", (chunk) => {
    stderr += chunk;
    const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (match) {
      clearTimeout(timeout);
      resolveWebSocket(match[1]);
    }
  });
  chrome.once("exit", (code) => {
    clearTimeout(timeout);
    reject(new Error(`Chrome exited before capture (code ${code}). ${stderr}`));
  });
});

const debugOrigin = browserWebSocket
  .replace(/^ws:/, "http:")
  .replace(/\/devtools\/browser\/.*$/, "");
const target = await fetch(`${debugOrigin}/json/new?about:blank`, {
  method: "PUT",
}).then((response) => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);

await new Promise((resolveOpen, reject) => {
  socket.addEventListener("open", resolveOpen, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
const pending = new Map();
const eventWaiters = new Map();

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
    return;
  }

  const waiters = eventWaiters.get(message.method) || [];
  eventWaiters.delete(message.method);
  waiters.forEach((resolveEvent) => resolveEvent(message.params));
});

const command = (method, params = {}) =>
  new Promise((resolveCommand, reject) => {
    const id = ++commandId;
    pending.set(id, { resolve: resolveCommand, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
const waitForEvent = (method) =>
  new Promise((resolveEvent) => {
    const waiters = eventWaiters.get(method) || [];
    waiters.push(resolveEvent);
    eventWaiters.set(method, waiters);
  });

try {
  await command("Page.enable");
  await command("Network.enable");
  await command("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 960,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const demoSession = await fetch(new URL("/api/auth/demo", baseUrl), {
    method: "POST",
  });
  if (!demoSession.ok) {
    throw new Error(`Unable to start the demo session (${demoSession.status}).`);
  }
  const sessionCookie = demoSession.headers.get("set-cookie") || "";
  const token = sessionCookie.match(/(?:^|;\s*)pb_session=([^;]+)/)?.[1];
  if (!token) {
    throw new Error("The demo session response did not include a session cookie.");
  }
  await command("Network.setCookie", {
    name: "pb_session",
    value: token,
    url: baseUrl,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  });

  for (const capture of captures) {
    const loaded = waitForEvent("Page.loadEventFired");
    await command("Page.navigate", { url: new URL(capture.path, baseUrl).href });
    await loaded;
    await command("Runtime.evaluate", {
      expression: "document.fonts.ready.then(() => true)",
      awaitPromise: true,
      returnByValue: true,
    });
    const deadline = Date.now() + 30000;
    let contentReady = false;
    while (Date.now() < deadline) {
      const readiness = await command("Runtime.evaluate", {
        expression: `document.body.innerText.includes(${JSON.stringify(capture.expectedText)})`,
        returnByValue: true,
      });
      if (readiness.result?.value === true) {
        contentReady = true;
        break;
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    }
    if (!contentReady) {
      throw new Error(`Timed out waiting for ${capture.name} content.`);
    }

    if (capture.previewText) {
      await command("Runtime.evaluate", {
        expression:
          "[...document.querySelectorAll('button')].find((button) => button.innerText.includes('Preview'))?.click()",
      });
      const previewDeadline = Date.now() + 10000;
      while (Date.now() < previewDeadline) {
        const previewReady = await command("Runtime.evaluate", {
          expression: `document.body.innerText.includes(${JSON.stringify(capture.previewText)})`,
          returnByValue: true,
        });
        if (previewReady.result?.value === true) break;
        await new Promise((resolveWait) => setTimeout(resolveWait, 250));
      }
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    const screenshot = await command("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const outputPath = join(outputDir, `${capture.name}.png`);
    writeFileSync(outputPath, Buffer.from(screenshot.data, "base64"));
    console.log(`Captured ${outputPath}`);
  }
} finally {
  socket.close();
  chrome.kill();
  await Promise.race([
    once(chrome, "exit"),
    new Promise((resolveWait) => setTimeout(resolveWait, 3000)),
  ]);
  const safeTempRoot = resolve(tmpdir());
  const resolvedProfile = resolve(profileDir);
  if (
    resolvedProfile.startsWith(`${safeTempRoot}\\`) &&
    basename(resolvedProfile).startsWith("levelos-trades-capture-")
  ) {
    try {
      rmSync(resolvedProfile, { recursive: true, force: true, maxRetries: 3 });
    } catch {
      console.warn(`Chrome profile cleanup deferred: ${resolvedProfile}`);
    }
  }
}
