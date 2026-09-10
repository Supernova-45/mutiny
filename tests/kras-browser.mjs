import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";
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
      document.querySelectorAll(".kras-page .structure-stage[data-ready=true]")
        .length === 2,
  );
const select = async (name) => {
  await page.getByRole("button", { name, exact: true }).click();
  await ready();
};
try {
  const direct = new URL(process.env.APP_URL ?? "http://127.0.0.1:5176");
  direct.searchParams.set("case", "kras");
  await page.goto(direct.href, { waitUntil: "networkidle" });
  await select("KRAS G12D");
  assert.equal(
    await page.locator(".kras-page .peptide-strip button").count(),
    20,
  );
  assert.match(
    await page.locator(".study-context").innerText(),
    /engineered receptor JDIa41b1/,
  );
  assert.equal(await page.locator(".kras-page .binding-reveal").count(), 0);
  await page
    .locator(".viewer-pair")
    .screenshot({ path: "outputs/screenshots/25-kras-mutation.png" });
  const right = page.locator(".molecule-canvas canvas").last();
  const before = await right.screenshot();
  const box = await page
    .locator(".molecule-canvas canvas")
    .first()
    .boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.55, {
    steps: 10,
  });
  await page.mouse.up();
  assert.notDeepEqual(
    await right.screenshot(),
    before,
    "Camera drag must update the other panel",
  );
  await page
    .getByRole("button", { name: "Can’t tell from shape", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reveal result", exact: true })
    .click();
  assert.match(await page.locator(".binding-reveal").innerText(), /3,000 nM/);
  assert.match(await page.locator(".binding-reveal").innerText(), /0.743 nM/);
  assert.match(
    await page.locator(".prediction-strip").innerText(),
    /shape alone could not tell us/,
  );
  await select("Inside the HLA groove Q70 · R114");
  await page
    .locator(".viewer-pair")
    .screenshot({ path: "outputs/screenshots/26-kras-contacts.png" });
  await page.locator(".kras-evidence summary").click();
  assert.match(
    await page.locator(".kras-evidence").innerText(),
    /OD2 → R114 NH2/,
  );
  let dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save investigation", exact: true })
    .click();
  let file = await dl;
  const saved = JSON.parse(fs.readFileSync(await file.path(), "utf8"));
  assert.equal(saved.view.scene, "contacts");
  assert.equal(saved.revealed, true);
  assert.equal(saved.view.camera.length, 8);
  await select("The engineered receptor JDIa41b1");
  await page
    .locator(".viewer-pair")
    .screenshot({ path: "outputs/screenshots/27-kras-receptor.png" });
  await page
    .getByLabel("Open KRAS investigation", { exact: true })
    .setInputFiles({
      name: "saved.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(saved)),
    });
  await ready();
  assert.equal(
    await page
      .getByRole("button", {
        name: "Inside the HLA groove Q70 · R114",
        exact: true,
      })
      .getAttribute("aria-pressed"),
    "true",
  );
  dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save investigation", exact: true })
    .click();
  const reopened = JSON.parse(fs.readFileSync(await (await dl).path(), "utf8"));
  reopened.view.camera.forEach((v, i) =>
    assert.ok(Math.abs(v - saved.view.camera[i]) < 1e-6),
  );
  await page
    .getByLabel("Open KRAS investigation", { exact: true })
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ ...saved, evidenceSha256: "stale" }),
      ),
    });
  assert.match(
    await page.getByRole("alert").innerText(),
    /different source evidence/,
  );
  assert.equal(
    await page
      .getByRole("button", {
        name: "Inside the HLA groove Q70 · R114",
        exact: true,
      })
      .getAttribute("aria-pressed"),
    "true",
  );
  dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save figure", exact: true }).click();
  file = await dl;
  await file.saveAs("work/kras-export.png");
  assert.ok(fs.statSync("work/kras-export.png").size > 20000);
  await page.getByRole("button", { name: "HHAT L75F", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".structure-stage[data-ready=true]").length ===
      2,
  );
  assert.match(await page.locator(".study-context").innerText(), /HHAT/);
  assert.equal(await page.locator(".binding-reveal").count(), 0);
  await select("KRAS G12D");
  assert.equal(
    await page
      .getByRole("button", {
        name: "Inside the HLA groove Q70 · R114",
        exact: true,
      })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.match(await page.locator(".binding-reveal").innerText(), /0.743/);
  await page
    .getByRole("button", { name: "Compare your pair", exact: true })
    .click();
  await page.getByRole("button", { name: "KRAS example", exact: true }).click();
  await ready();
  assert.match(await page.locator(".binding-reveal").innerText(), /0.743/);
  assert.equal(new URL(page.url()).searchParams.get("case"), "kras");
  await page.getByRole("button", { name: "Expand 3D", exact: true }).click();
  assert.equal(await page.locator(".molecular-workspace.expanded").count(), 1);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".molecular-workspace.expanded").count(), 0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("button", { name: "The mutation G6 → D6", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "The engineered receptor JDIa41b1",
      exact: true,
    })
    .click();
  await ready();
  assert.equal(await page.locator(".viewer-loading").count(), 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await select("The mutation G6 → D6");
  await page
    .locator(".viewer-pair")
    .screenshot({ path: "work/kras-mobile.png" });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.equal(await page.locator("textarea").count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: KRAS source loading, 20 residues, linked cameras, all three scenes, measured reveal, case isolation, session retention, save/reopen, stale-source rejection, figure export, expanded/mobile views.",
  );
} finally {
  await browser.close();
}
