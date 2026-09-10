import { chromium } from "@playwright/test";
import fs from "node:fs";
import crypto from "node:crypto";
const root = "work/hero-frames";
fs.mkdirSync(root, { recursive: true });
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
  viewport: { width: 1100, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
page.setDefaultTimeout(30000);
const stages = [
  ["The mutation L8 → F8", "HHAT L75F · one amino acid"],
  ["The neighboring shape W6", "W6 · a neighboring residue"],
  ["The receptor contact W6 · Tyr100α", "302TIL · the receptor contact"],
];
const frames = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(process.env.APP_URL ?? "http://127.0.0.1:5173", {
    waitUntil: "networkidle",
  });
  for (let stage = 0; stage < stages.length; stage++) {
    await page
      .getByRole("button", { name: stages[stage][0], exact: true })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".structure-stage[data-ready=true]")
          .length === 2,
    );
    if (stage === 0) {
      await page.getByRole("button", { name: "Atoms", exact: true }).click();
      await page.waitForFunction(
        () =>
          document.querySelectorAll(".structure-stage[data-ready=true]")
            .length === 2,
      );
    }
    const pair = page.locator(".viewer-pair");
    await pair.scrollIntoViewIfNeeded();
    const box = await page
      .locator(".molecule-canvas canvas")
      .first()
      .boundingBox();
    if (stage === 0) {
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.wheel(0, 150);
      await page.waitForTimeout(250);
    }
    for (let i = 0; i < 18; i++) {
      const name = `${String(frames.length).padStart(3, "0")}.png`;
      await pair.screenshot({ path: `${root}/${name}` });
      frames.push({
        file: name,
        stage,
        title: stages[stage][1],
        duration: i === 0 || i === 17 ? 650 : 240,
      });
      const dx = i < 9 ? 2.5 : -2.5;
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(
        box.x + box.width * 0.5 + dx,
        box.y + box.height * 0.5 + dx * 0.25,
        { steps: 2 },
      );
      await page.mouse.up();
    }
    console.log(`Captured ${stages[stage][1]}`);
  }
  if (errors.length) throw Error(errors.join("\n"));
  fs.writeFileSync(`${root}/frames.json`, JSON.stringify(frames, null, 2));
  const sources = [
    "public/data/structures.json",
    "public/data/hhat-evidence.json",
    ...["6UJQ", "6UJO", "6UK2", "6UK4"].map(
      (id) => `public/structures/${id}.pdb`,
    ),
  ];
  fs.writeFileSync(
    "outputs/hero-loop.provenance.json",
    JSON.stringify(
      {
        description:
          "Actual app captures with paired camera rotation. Three discrete experimental views; no atom interpolation. Caption bands added from the frame manifest and bundled experimental evidence.",
        frames: frames.length,
        durationMs: frames.reduce((s, f) => s + f.duration, 0),
        sources: sources.map((path) => ({
          path,
          sha256: crypto
            .createHash("sha256")
            .update(fs.readFileSync(path))
            .digest("hex"),
        })),
        paper: "https://doi.org/10.1038/s41589-020-0610-1",
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
