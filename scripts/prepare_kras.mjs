// Curated two-deposit mapping only. Does not relax the generic PDB importer.
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parsePdb, fitRigid } from "../src/lib/structure-pair.mjs";
const root = "rosalind/contrast-kras/";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha = (text) => createHash("sha256").update(text).digest("hex");
const evidence = read(root + "case.json"),
  independent = read(root + "independent-comparison.json");
for (const source of read(root + "retrieval.json"))
  assert.equal(sha(fs.readFileSync(source.path)), source.sha256);
const ids = ["7OW5", "7OW6"],
  texts = ids.map((id) => fs.readFileSync(`${root}sources/${id}.pdb`, "utf8"));
const parsed = texts.map(parsePdb),
  chain = (i, id) => parsed[i].chains.find((c) => c.id === id);
const seqres = (text) =>
  text
    .split("\n")
    .filter((l) => l.startsWith("SEQRES"))
    .reduce(
      (r, l) => ({
        ...r,
        [l[11]]: [...(r[l[11]] ?? []), ...l.slice(19, 70).trim().split(/\s+/)],
      }),
      {},
    );
const declarations = texts.map(seqres);
for (const c of ["A", "D", "E"])
  assert.deepEqual(declarations[0][c], declarations[1][c]);
assert.deepEqual(
  ids.map((_, i) => chain(i, "C").sequence),
  [evidence.identity.normalPeptide, evidence.identity.mutantPeptide],
);
const hla = ids.map((_, i) => chain(i, "A").residues);
assert.deepEqual(
  hla.map((rows) => rows.map((r) => r.number)),
  [
    Array.from({ length: 275 }, (_, i) => i + 2),
    Array.from({ length: 276 }, (_, i) => i + 1),
  ],
);
const pairs = hla[0].map((a) => [
  a,
  hla[1].find((b) => b.number === a.number && b.insertion === a.insertion),
]);
for (const [a, b] of pairs) {
  assert.equal(a.aa, b.aa);
  assert.equal(a.insertion, "");
}
const xyz = (r, name) => r.atoms.find((a) => a.atom === name).xyz;
const fit = fitRigid(
  pairs.map(([, b]) => xyz(b, "CA")),
  pairs.map(([a]) => xyz(a, "CA")),
);
assert.ok(
  Math.abs(fit.rmsd - independent.commonAuthorWhole.alignment.rmsd) < 1e-9,
);
const transform = fit.apply;
const generated = texts.map(
  (text, i) =>
    `REMARK 900 MUTINY DERIVED VIEW; SOURCE ${ids[i]}; SHA256 ${sha(text)}\n` +
    text
      .split("\n")
      .filter((l) => l.startsWith("ATOM  "))
      .map((l) => {
        const p = [30, 38, 46].map((k) => Number(l.slice(k, k + 8))),
          q = i ? transform(p) : p;
        return (
          l.slice(0, 30) +
          q.map((x) => x.toFixed(3).padStart(8)).join("") +
          l.slice(54)
        );
      })
      .join("\n") +
    "\nEND\n",
);
const contacts = read(root + "contacts.json");
for (const c of contacts) {
  const i = ids.indexOf(c.pdb),
    point = (atom) =>
      xyz(
        chain(i, atom.chain).residues.find((r) => r.number === atom.residue),
        atom.name,
      );
  assert.ok(
    Math.abs(
      Math.hypot(
        ...point(c.peptideAtom).map((x, j) => x - point(c.hlaAtom)[j]),
      ) - c.distanceAngstrom,
    ) < 1e-9,
  );
}
const sourceFiles = [
  "case.json",
  "independent-comparison.json",
  "contacts.json",
  "coverage.json",
  "native-contacts.json",
  "native-sequences.json",
  "retrieval.json",
  "sources/poole.xml",
];
const result = {
  id: evidence.id,
  identity: evidence.identity,
  assay: evidence.assays[0],
  quality: evidence.quality,
  sources: sourceFiles.map((p) => ({
    path: root + p,
    sha256: sha(fs.readFileSync(root + p)),
  })),
  structures: ids.map((id, i) => ({
    id,
    state: i ? "mutant" : "normal",
    peptide: i
      ? evidence.identity.mutantPeptide
      : evidence.identity.normalPeptide,
    path: `/structures/kras/${id}.pdb`,
    sourcePath: `${root}sources/${id}.pdb`,
    sourceSha256: sha(texts[i]),
    alignedSha256: sha(generated[i]),
  })),
  alignment: {
    policy: "curated-kras-shared-hla-v1",
    description:
      "Mutant fitted to normal on 275 shared HLA A Cα atoms, author positions 2–276. Identical SEQRES constructs and observed identities verified for these deposits only. Peptide never fitted.",
    ...fit,
    atomCount: pairs.length,
    matchedResidues: pairs.map(([a, b]) => ({
      normal: { chain: "A", number: a.number, insertion: a.insertion },
      mutant: { chain: "A", number: b.number, insertion: b.insertion },
    })),
    excluded: [
      {
        state: "mutant",
        chain: "A",
        number: 1,
        reason: "Not observed in normal deposit",
      },
    ],
  },
  differences: independent.commonAuthorWhole.differences.map((r) => ({
    position: r.position,
    normal: r.normal,
    mutant: r.mutant,
    sourceResidues: r.sourceResidues,
    backbone: r.backbone,
  })),
  contacts,
  paper: evidence.sources.paper,
};
fs.mkdirSync("public/structures/kras", { recursive: true });
ids.forEach((id, i) =>
  fs.writeFileSync(`public/structures/kras/${id}.pdb`, generated[i]),
);
fs.writeFileSync(
  "public/data/kras.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  `Prepared KRAS: ${fit.rmsd.toFixed(9)} Å / ${pairs.length} HLA Cα; 2 original source hashes, explicit exclusion, 4 contacts.`,
);
