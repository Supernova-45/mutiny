import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
const base = process.env.APP_URL || "http://127.0.0.1:4177";
const server = process.env.APP_URL
  ? null
  : spawn(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        "4177",
        "--strictPort",
      ],
      { stdio: "ignore" },
    );
let browser;
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  browser = await chromium.launch({
    channel: "chromium",
    headless: true,
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
  page.setDefaultTimeout(45000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const ready = () =>
    page.waitForFunction(
      () =>
        document.querySelectorAll(".structure-stage[data-ready=true]")
          .length === 2,
    );
  const noOverflow = async () =>
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
  await page.goto(base);
  await ready();
  await expect(
    page.getByText("Same residue. Different poses.", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".topbar")
      .getByRole("button", { name: "Candidate review", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".secondary-tools")
      .getByRole("button", { name: "Candidate review" }),
  ).toHaveCount(0);
  assert.ok(
    (await page.locator(".viewer-pair").boundingBox()).y < 410,
    "The molecular scene should lead the first viewport",
  );
  await page.screenshot({
    path: "outputs/screenshots/36-cohesive-desktop.png",
  });
  await page.locator(".investigation-actions summary").click();
  await expect(
    page.getByRole("button", { name: "Save investigation", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".investigation-actions")).not.toHaveAttribute(
    "open",
    "",
  );
  await page.locator(".investigation-actions summary").click();
  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Save investigation", exact: true })
      .click(),
  ]);
  const saved = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  assert.equal(saved.kind, "mutiny-hhat-investigation");
  await page.getByRole("button", { name: "Expand 3D", exact: true }).click();
  await page
    .getByRole("button", { name: "Binding experiment", exact: true })
    .click();
  await expect(page.locator(".molecular-workspace")).not.toHaveClass(
    /expanded/,
  );
  await expect(page.locator(".prediction-strip")).toBeFocused();
  await page.getByRole("button", { name: "Mutant", exact: true }).click();
  await page
    .getByRole("button", { name: "Reveal result", exact: true })
    .click();
  await expect(page.locator(".binding-reveal")).toContainText("200");
  await page
    .getByRole("button", { name: "Evidence and methods", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("HHAT L75F");
  await expect(page.getByRole("dialog")).not.toContainText(
    "One selected vaccine cohort",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "KRAS G12D", exact: true }).click();
  await ready();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "outputs/screenshots/37-cohesive-kras.png" });
  await page
    .getByRole("button", { name: "Binding experiment", exact: true })
    .click();
  await expect(page.locator(".prediction-strip")).toBeFocused();
  await page
    .getByRole("button", { name: "Candidate review", exact: true })
    .click();
  await expect(page.locator(".research-page")).toBeVisible();
  await page
    .getByRole("button", { name: "Vaccine study", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Evidence and methods", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "One selected vaccine cohort",
  );
  await expect(page.getByRole("dialog")).not.toContainText(
    "A contrasting KRAS",
  );
  await page.keyboard.press("Escape");
  await page.goto(base);
  await ready();
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 844 });
    await noOverflow();
    await expect(
      page
        .locator(".topbar")
        .getByRole("button", { name: "Candidate review", exact: true }),
    ).toBeInViewport();
    if (width === 390) {
      await page.locator("h1").click();
      await page.screenshot({
        path: "outputs/screenshots/38-cohesive-mobile.png",
      });
    }
    await page.locator(".investigation-actions summary").click();
    await noOverflow();
    await page.keyboard.press("Escape");
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: cohesive desktop/mobile navigation, early molecular scene, file menu and save, expanded-view experiment jump, and contextual evidence.",
  );
} finally {
  await browser?.close();
  server?.kill();
}
