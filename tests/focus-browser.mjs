import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawn } from "node:child_process";
let server,
  serverLog = "";
const browser = await chromium.launch({
  headless: true,
  // Full Chromium's current headless mode exercises the real browser graphics path.
  // This also avoids the legacy shell's graphics-capture stalls observed in Linux CI.
  channel: process.env.CHROME_EXECUTABLE ? undefined : "chromium",
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
  acceptDownloads: true,
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.setDefaultTimeout(45000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const exportTrace = [];
await page.exposeFunction("__traceExport", (event) => {
  exportTrace.push(event);
  fs.mkdirSync("work/focus-check", { recursive: true });
  fs.writeFileSync(
    "work/focus-check/export-trace.json",
    JSON.stringify(exportTrace, null, 2),
  );
});
await page.addInitScript(() => {
  const report = (event) =>
    void window.__traceExport({ event, at: performance.now() });
  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest?.('[aria-label="Save superposition figure"]'))
        report("export button clicked");
    },
    true,
  );
  const draw = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (...args) {
    const track =
      this.canvas.width > 500 && args[0] instanceof HTMLCanvasElement;
    if (track) report("canvas copy start");
    const result = draw.apply(this, args);
    if (track) report("canvas copy end");
    return result;
  };
  const toBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
    report("PNG encode start");
    return toBlob.call(
      this,
      (blob) => {
        report("PNG encode end");
        callback(blob);
      },
      ...args,
    );
  };
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.download) report("download anchor clicked");
    return click.call(this);
  };
});

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
  await page.getByRole("button", { name: /03\s*The receptor$/ }).click();
  await ready();
  await dialog
    .getByRole("button", { name: "Molecular context", exact: true })
    .click();
  await ready();
  await expect(page.locator(".focus-stage")).toHaveAttribute(
    "data-context",
    "true",
  );
  await page.screenshot({
    path: "outputs/screenshots/33-hhat-molecular-context.png",
  });
  await dialog.getByRole("button", { name: "Share view", exact: true }).click();
  const contextLink = await page.evaluate(() => navigator.clipboard.readText());
  const contextState = JSON.parse(
    decodeURIComponent(new URL(contextLink).hash.slice(9)),
  );
  assert.equal(contextState.context, true);
  await dialog
    .getByRole("button", { name: "Orbit camera", exact: true })
    .click();
  await expect(page.locator(".focus-stage")).toHaveAttribute(
    "data-orbit",
    "true",
  );
  await page.waitForTimeout(600);
  await page.locator(".focus-canvas").dispatchEvent("pointerdown");
  await expect(page.locator(".focus-stage")).toHaveAttribute(
    "data-orbit",
    "false",
  );
  await dialog.getByRole("button", { name: /Share view|Copied/ }).click();
  const orbitedLink = await page.evaluate(() => navigator.clipboard.readText());
  const orbitedState = JSON.parse(
    decodeURIComponent(new URL(orbitedLink).hash.slice(9)),
  );
  assert.ok(
    orbitedState.camera.some(
      (v, i) => Math.abs(v - contextState.camera[i]) > 1e-4,
    ),
    "Orbit changes the camera",
  );
  await page.goto(contextLink);
  await ready();
  await expect(page.locator(".focus-stage")).toHaveAttribute(
    "data-context",
    "true",
  );
  await expect(page.locator(".focus-stage")).toHaveAttribute(
    "data-orbit",
    "false",
  );
  await dialog
    .getByRole("button", { name: "Peptide position 6, W", exact: true })
    .click();
  await ready();
  await expect(page.locator(".focus-stage")).toHaveAttribute(
    "data-context",
    "false",
  );
  await page.getByRole("button", { name: /02\s*The neighbor$/ }).click();
  await ready();
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
  const exportButton = page.getByRole("button", {
    name: "Save superposition figure",
  });
  await expect(exportButton).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    exportButton.click(),
  ]);
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
  await page.getByRole("button", { name: /03\s*The receptor$/ }).click();
  await dialog
    .getByRole("button", { name: "Molecular context", exact: true })
    .click();
  await ready();
  await page.screenshot({
    path: "outputs/screenshots/34-kras-molecular-context.png",
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
  await dialog
    .getByRole("button", { name: "The receptor", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Molecular context", exact: true })
    .click();
  await ready();
  await page.screenshot({
    path: "outputs/screenshots/35-mobile-molecular-context.png",
  });
  assert.ok(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  );
  assert.deepEqual(errors, []);
  console.log(
    "Verified molecular context, camera orbit and manual takeover, HHAT/KRAS superposition, four density maps, source-bound links, exported figure, invalid-link recovery, and mobile layout.",
  );
} catch (e) {
  fs.writeFileSync(
    "work/focus-check/failure.json",
    JSON.stringify(
      {
        error: String(e),
        pageErrors: errors,
        url: page.url(),
        dialog: await page
          .locator(".focus-dialog")
          .textContent({ timeout: 1000 })
          .catch(() => null),
        stage: await page
          .locator(".focus-stage")
          .evaluate((el) => ({
            ready: el.dataset.ready,
            density: el.dataset.density,
            busy: el.getAttribute("aria-busy"),
          }))
          .catch(() => null),
      },
      null,
      2,
    ),
  );
  await page
    .screenshot({ path: "work/focus-check/failure.png", timeout: 10000 })
    .catch(() => {});
  throw e;
} finally {
  await browser.close();
  server?.kill();
}
