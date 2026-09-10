import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawn } from "node:child_process";
let server,
  serverLog = "";
const browser = await chromium.launch({
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
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.setDefaultTimeout(45000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const ready = () =>
  page.waitForFunction(
    () =>
      document.querySelector(".focus-stage")?.getAttribute("data-ready") ===
      "true",
  );
const density = () =>
  page.waitForFunction(
    () =>
      document.querySelector(".focus-stage")?.getAttribute("data-density") ===
      "ready",
  );
const base = process.env.APP_URL ?? "http://127.0.0.1:4178";
fs.mkdirSync("work/focus-check", { recursive: true });
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
        "4178",
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
    let started = false;
    for (let i = 0; i < 60; i++) {
      if (server.exitCode !== null) throw Error(`Preview exited: ${serverLog}`);
      try {
        const r = await fetch(base, { signal: AbortSignal.timeout(2000) });
        if (r.ok) {
          started = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.ok(started, `Preview did not start: ${serverLog}`);
  }
  await page.goto(base);
  await page
    .getByRole("button", { name: "Superimpose in 3D", exact: true })
    .click();
  await ready();
  const dialog = page.getByRole("dialog");
  assert.equal(
    await dialog
      .getByRole("button", { name: "Superimpose", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.screenshot({
    path: "outputs/screenshots/29-superimposed-hhat.png",
  });
  await dialog
    .getByRole("button", { name: "Experimental density", exact: true })
    .click();
  await density();
  assert.equal(
    await dialog
      .getByRole("button", { name: "Mutant", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.screenshot({ path: "outputs/screenshots/30-hhat-density.png" });
  await dialog
    .getByRole("combobox", { name: "Density contour" })
    .selectOption("1.3");
  await density();
  await dialog.getByRole("button", { name: "Normal", exact: true }).click();
  await ready();
  await density();
  await dialog
    .getByRole("button", { name: "Peptide position 8, L", exact: true })
    .click();
  await ready();
  await density();
  await dialog.getByRole("button", { name: "Share view", exact: true }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(shared, /#compare=/);
  await page.goto(shared);
  await ready();
  await density();
  await page.getByRole("button", { name: "Share view", exact: true }).click();
  const reshared = await page.evaluate(() => navigator.clipboard.readText());
  const decode = (url) =>
    JSON.parse(decodeURIComponent(new URL(url).hash.slice(9)));
  const firstView = decode(shared),
    secondView = decode(reshared);
  assert.ok(
    firstView.camera.every((v, i) => Math.abs(v - secondView.camera[i]) < 1e-4),
  );
  assert.equal(
    await page.getByRole("combobox", { name: "Density contour" }).inputValue(),
    "1.3",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Peptide position 8, L", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Normal", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: /03\s*The receptor$/ }).click();
  await ready();
  await density();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mutant", exact: true })
    .click();
  await ready();
  await density();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save superposition figure" }).click();
  const download = await downloading;
  await download.saveAs("work/focus-check/export.png");
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.equal(await page.evaluate(() => location.hash), "");
  await page.goto(base + "/?case=kras");
  await page
    .getByRole("button", { name: "Superimpose in 3D", exact: true })
    .click();
  await ready();
  assert.equal(
    await page
      .getByRole("button", { name: "Experimental density", exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: /02\s*The HLA groove$/ }).click();
  await ready();
  await page.screenshot({
    path: "outputs/screenshots/31-superimposed-kras.png",
  });
  await page.getByRole("button", { name: "Share view", exact: true }).click();
  const krasLink = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(krasLink);
  await ready();
  assert.match(
    await page.getByRole("dialog").getAttribute("aria-label"),
    /KRAS/,
  );
  await page.keyboard.press("Escape");
  const stale = new URL(krasLink);
  const state = JSON.parse(decodeURIComponent(stale.hash.slice(9)));
  state.sources = "b".repeat(64);
  stale.hash = "compare=" + encodeURIComponent(JSON.stringify(state));
  await page.goto(stale.href);
  await page.getByRole("dialog").getByRole("alert").waitFor();
  assert.match(
    await page.getByRole("dialog").getByRole("alert").textContent(),
    /different source/,
  );
  await page.keyboard.press("Escape");
  await page.goto(base + "/#compare=%zz");
  await page.getByRole("dialog").getByRole("alert").waitFor();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Superimpose in 3D", exact: true })
    .click();
  await ready();
  await page.screenshot({
    path: "outputs/screenshots/32-mobile-superposition.png",
  });
  assert.ok(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  );
  assert.deepEqual(errors, []);
  console.log(
    "Verified HHAT/KRAS superposition, four density maps, source-bound links, exported figure, invalid-link recovery, and mobile layout.",
  );
} catch (e) {
  await page.screenshot({ path: "work/focus-check/failure.png" });
  throw e;
} finally {
  await browser.close();
  server?.kill();
}
