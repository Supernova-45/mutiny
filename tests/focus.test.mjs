import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { focusLink, parseFocusLink } from "../src/lib/focus-link.mjs";
const sha = (b) => createHash("sha256").update(b).digest("hex");
const view = {
  version: 1,
  caseId: "hhat",
  step: 1,
  residue: 6,
  mode: "mutant",
  density: true,
  contour: 1,
  sources: "a".repeat(64),
  camera: [0, 0, 0, 100, 0, 0, 0, 1],
};
test("shared views preserve a curated camera and reject incompatible state", () => {
  const url = new URL(focusLink("https://example.org/?case=kras", view));
  assert.equal(url.searchParams.get("case"), "hhat");
  assert.deepEqual(parseFocusLink(url.hash), view);
  assert.equal(parseFocusLink("#something-else"), null);
  for (const overrides of [
    { residue: 10 },
    { mode: "both" },
    { caseId: "kras" },
    { sources: "old" },
    { camera: [0, 0, 0, 1, 0, 0, 0, 0] },
    { camera: [0, 0, 0, 1, 0, 0, 0, "1"] },
    { step: 3 },
    { contour: 9 },
    { version: 2 },
  ])
    assert.throws(() => focusLink(url.href, { ...view, ...overrides }));
  assert.throws(() => parseFocusLink("#compare=%zz"));
});
const manifest = JSON.parse(
  fs.readFileSync("public/density/manifest.json", "utf8"),
);
const structures = JSON.parse(
  fs.readFileSync("public/data/structures.json", "utf8"),
).structures;
for (const s of manifest.sources)
  test(`${s.id}: map grid matches the exact display coordinates and original-frame density samples`, () => {
    assert.equal(s.channel, "2Fo-Fc");
    assert.equal(
      s.displaySha256,
      structures.find((x) => x.id === s.id).alignedSha256,
    );
    assert.equal(
      sha(fs.readFileSync("public" + s.displayPath)),
      s.displaySha256,
    );
    assert.equal(sha(fs.readFileSync(s.rawPdbPath)), s.rawPdbSha256);
    const compressed = fs.readFileSync("public" + s.path);
    assert.equal(sha(compressed), s.sha256);
    const bytes = gunzipSync(compressed);
    assert.equal(bytes.length, s.size.reduce((a, b) => a * b, 1) * 4);
    const at = (x, y, z) =>
      bytes.readFloatLE(((x * s.size[1] + y) * s.size[2] + z) * 4);
    let maxDifference = 0;
    for (const atom of s.atomSamples) {
      const p = atom.display.map((v, i) => (v - s.origin[i]) / s.spacing);
      const base = p.map(Math.floor),
        fraction = p.map((v, i) => v - base[i]);
      assert.ok(base.every((v, i) => v >= 0 && v + 1 < s.size[i]));
      let sampled = 0;
      for (let x = 0; x < 2; x++)
        for (let y = 0; y < 2; y++)
          for (let z = 0; z < 2; z++)
            sampled +=
              at(base[0] + x, base[1] + y, base[2] + z) *
              (x ? fraction[0] : 1 - fraction[0]) *
              (y ? fraction[1] : 1 - fraction[1]) *
              (z ? fraction[2] : 1 - fraction[2]);
      maxDifference = Math.max(maxDifference, Math.abs(sampled - atom.sigma));
    }
    // A second interpolation on the cropped 0.35 Å grid smooths peaks slightly.
    assert.ok(
      maxDifference < 0.6,
      `Resampled atom density error ${maxDifference} sigma`,
    );
    assert.ok(s.verification.maxPeptideCoordinateErrorAngstrom < 0.0015);
    assert.ok(s.verification.maxAtomSampleDifferenceSigma < 0.02);
  });
