import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
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
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const ready = () =>
  page.waitForFunction(
    () =>
      document.querySelectorAll(".structure-stage[data-ready=true]").length ===
      2,
  );
const select = async (name) => {
  await page.getByRole("button", { name, exact: true }).click();
  await ready();
};
try {
  await page.goto(process.env.APP_URL ?? "http://127.0.0.1:5173", {
    waitUntil: "networkidle",
  });
  await ready();
  await select("The mutation L8 → F8");
  await page
    .getByRole("button", { name: "The neighboring shape W6", exact: true })
    .click();
  // Camera transition is visible, not covered by the loading mask.
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".structure-stage[aria-busy=true]").length >
        0 && document.querySelectorAll(".viewer-loading").length === 0,
  );
  await ready();
  await page
    .locator(".viewer-pair")
    .screenshot({ path: "outputs/screenshots/23-dark-w6.png" });
  await page
    .locator(".pose-comparison")
    .screenshot({ path: "outputs/screenshots/21-w6-pose-differences.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await select("The mutation L8 → F8");
  await select("The neighboring shape W6");
  assert.equal(
    await page
      .locator(".pose-track>i")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
    "none",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("button", { name: "The mutation L8 → F8", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "The receptor contact W6 · Tyr100α",
      exact: true,
    })
    .click();
  await ready();
  assert.match(
    await page.locator(".structure-title").first().innerText(),
    /6UK2/,
  );
  assert.match(
    await page.locator(".structure-title").last().innerText(),
    /6UK4/,
  );
  await page
    .locator(".viewer-pair")
    .screenshot({ path: "outputs/screenshots/24-dark-contact.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.equal(await page.locator("textarea").count(), 0);
  assert.equal(await page.locator(".viewer-error").count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: visible camera reveal, reduced-motion behavior, rapid-state cancellation, final structure identities, dark W6/contact renders, mobile, no browser errors.",
  );
} finally {
  await browser.close();
}
