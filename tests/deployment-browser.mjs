// Check the complete built artifact, including lazy chunks, then exercise the visible app.
// APP_URL checks a remote deployment against local dist; omitted starts Vite preview.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
const artifactDir = "work/deployment-check";
fs.mkdirSync(artifactDir, { recursive: true });
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const files = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((f) =>
      f.isDirectory()
        ? files(path.join(dir, f.name))
        : [path.join(dir, f.name)],
    );
const built = files("dist");
assert.ok(
  built.includes("dist/index.html"),
  "Build the deployed commit before checking parity.",
);
let server,
  browser,
  serverLog = "";
const base = new URL(process.env.APP_URL ?? "http://127.0.0.1:4179/");
const get = async (file) => {
  const response = await fetch(new URL(file, base), {
    signal: AbortSignal.timeout(30000),
    cache: "no-store",
  });
  assert.ok(response.ok, `${file}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};
try {
  if (!process.env.APP_URL) {
    server = spawn(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        "4179",
        "--strictPort",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    server.stdout.on("data", (b) => {
      serverLog += b;
    });
    server.stderr.on("data", (b) => {
      serverLog += b;
    });
    let available = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (server.exitCode !== null) throw Error(`Preview exited: ${serverLog}`);
      try {
        await get("");
        available = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    assert.ok(available, `Preview did not start: ${serverLog}`);
  }
  // Hash decoded response bodies, not gzip transfer bytes. HTML, fonts, scientific
  // data and coordinates are covered alongside every emitted entry and lazy chunk.
  const verified = [];
  for (let offset = 0; offset < built.length; offset += 8) {
    await Promise.all(
      built.slice(offset, offset + 8).map(async (file) => {
        const relative = path.relative("dist", file).split(path.sep).join("/");
        const expected = digest(fs.readFileSync(file)),
          actual = digest(await get(relative === "index.html" ? "" : relative));
        assert.equal(
          actual,
          expected,
          `Deployed bytes differ: ${relative}. Confirm the checkout matches the deployed commit.`,
        );
        verified.push({ path: relative, sha256: actual });
      }),
    );
  }
  fs.writeFileSync(
    `${artifactDir}/verified-assets.json`,
    JSON.stringify(
      verified.sort((a, b) => a.path.localeCompare(b.path)),
      null,
      2,
    ) + "\n",
  );
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_EXECUTABLE
      ? { executablePath: process.env.CHROME_EXECUTABLE }
      : {}),
    args: [
      "--enable-webgl",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const requested = new URL(base);
  requested.searchParams.set("case", "kras");
  try {
    await page.goto(requested.href, { waitUntil: "networkidle" });
    assert.equal(
      await page.locator("h1").innerText(),
      "Similar shapes. Different recognition?",
    );
    await page.waitForFunction(
      () =>
        document.querySelectorAll(
          ".kras-page .structure-stage[data-ready=true]",
        ).length === 2,
    );
    assert.match(
      await page.locator(".structure-title").first().innerText(),
      /7OW5/,
    );
    assert.match(
      await page.locator(".structure-title").last().innerText(),
      /7OW6/,
    );
    assert.equal(await page.locator(".binding-reveal").count(), 0);
    await page.getByRole("button", { name: "Mutant", exact: true }).click();
    await page
      .getByRole("button", { name: "Reveal result", exact: true })
      .click();
    assert.match(await page.locator(".binding-reveal").innerText(), /3,000 nM/);
    assert.match(
      await page.locator(".binding-reveal").innerText(),
      /0\.743 nM/,
    );
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${artifactDir}/kras.png` });
  } catch (error) {
    await page
      .screenshot({ path: `${artifactDir}/failure.png` })
      .catch(() => {});
    throw error;
  }
  console.log(
    `PASS: ${verified.length} deployed files match dist; lazy KRAS route, both verified structures and measured reveal render without errors.`,
  );
} finally {
  await browser?.close();
  server?.kill("SIGTERM");
}
