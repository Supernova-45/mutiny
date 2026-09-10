import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { parsePdb, compareStructures } from "../src/lib/structure-pair.mjs";
const data = JSON.parse(fs.readFileSync("public/data/kras.json", "utf8"));
const sha = (p) =>
  createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const displays = data.structures.map((s) =>
  parsePdb(fs.readFileSync("public" + s.path, "utf8")),
);
const residue = (p, c, n) =>
  p.chains.find((x) => x.id === c).residues.find((r) => r.number === n);
const atom = (p, c, n, a) =>
  residue(p, c, n).atoms.find((x) => x.atom === a).xyz;
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
test("KRAS source identities, explicit HLA mapping and assay reagent stay pinned", () => {
  for (const s of data.sources) assert.equal(sha(s.path), s.sha256);
  for (const s of data.structures) {
    assert.equal(sha(s.sourcePath), s.sourceSha256);
    assert.equal(sha("public" + s.path), s.alignedSha256);
  }
  assert.equal(
    data.identity.receptor,
    "JDIa41b1, second-generation affinity-enhanced JDI TCR",
  );
  assert.equal(data.alignment.policy, "curated-kras-shared-hla-v1");
  assert.equal(data.alignment.matchedResidues.length, 275);
  assert.deepEqual(data.alignment.excluded, [
    {
      state: "mutant",
      chain: "A",
      number: 1,
      reason: "Not observed in normal deposit",
    },
  ]);
  assert.deepEqual(
    data.alignment.matchedResidues.map((r) => r.normal.number),
    Array.from({ length: 275 }, (_, i) => i + 2),
  );
  assert.equal(data.assay.normal.value, 3e-6);
  assert.equal(data.assay.normal.standardDeviation, null);
  assert.equal(data.assay.mutant.value, 7.43e-10);
  assert.equal(data.assay.mutant.standardDeviation, 1.8e-11);
  assert.equal(data.assay.n, 2);
  assert.throws(
    () =>
      compareStructures(
        ...data.structures.map((s) => fs.readFileSync(s.sourcePath, "utf8")),
        [
          { hla: "A", peptide: "C" },
          { hla: "A", peptide: "C" },
        ],
      ),
    /identical observed HLA/,
  );
});
test("KRAS displayed coordinates reproduce independent HLA and backbone metrics after rounding", () => {
  const ds = data.alignment.matchedResidues.map((r) =>
    distance(
      atom(displays[0], "A", r.normal.number, "CA"),
      atom(displays[1], "A", r.mutant.number, "CA"),
    ),
  );
  assert.ok(
    Math.abs(
      Math.sqrt(ds.reduce((s, v) => s + v * v, 0) / ds.length) -
        data.alignment.rmsd,
    ) < 0.002,
  );
  for (const d of data.differences) {
    const ds = d.backbone.atoms.map((a) =>
      distance(
        atom(displays[0], "C", d.position, a),
        atom(displays[1], "C", d.position, a),
      ),
    );
    assert.ok(
      Math.abs(
        Math.sqrt(ds.reduce((s, v) => s + v * v, 0) / ds.length) -
          d.backbone.value,
      ) < 0.002,
    );
    assert.equal(d.sidechain, undefined);
  }
  for (const p of displays) {
    assert.ok(p.chains.find((c) => c.id === "D"));
    assert.ok(p.chains.find((c) => c.id === "E"));
  }
});
test("KRAS annotations identify the actual contact atoms, including unlike normal/mutant pairs", () => {
  for (const c of data.contacts) {
    const p = displays[data.structures.findIndex((s) => s.id === c.pdb)];
    const a = c.peptideAtom,
      b = c.hlaAtom;
    assert.ok(
      Math.abs(
        distance(
          atom(p, a.chain, a.residue, a.name),
          atom(p, b.chain, b.residue, b.name),
        ) - c.distanceAngstrom,
      ) < 0.002,
    );
  }
  assert.equal(
    data.contacts.find((c) => c.pdb === "7OW5" && c.hlaAtom.residue === 114)
      .peptideAtom.name,
    "N",
  );
  assert.equal(
    data.contacts.find((c) => c.pdb === "7OW6" && c.hlaAtom.residue === 114)
      .peptideAtom.name,
    "OD2",
  );
  assert.equal(data.quality.mapsInspected, false);
});
