// Deterministic, browser-local comparison of an explicitly assigned HLA/peptide pair.
const letters = {
  ALA: "A",
  ARG: "R",
  ASN: "N",
  ASP: "D",
  CYS: "C",
  GLN: "Q",
  GLU: "E",
  GLY: "G",
  HIS: "H",
  ILE: "I",
  LEU: "L",
  LYS: "K",
  MET: "M",
  PHE: "F",
  PRO: "P",
  SER: "S",
  THR: "T",
  TRP: "W",
  TYR: "Y",
  VAL: "V",
};
const backbone = new Set(["N", "CA", "C", "O", "OXT"]);
export const MAX_PDB_BYTES = 3 * 1024 * 1024;
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a) => Math.hypot(...a);
const unit = (a) => {
  const n = norm(a);
  if (n < 1e-8) throw Error("Cannot orient a degenerate structure.");
  return a.map((v) => v / n);
};
const mean = (points) =>
  [0, 1, 2].map(
    (i) => points.reduce((sum, p) => sum + p[i], 0) / points.length,
  );
const rmsd = (a, b) =>
  Math.sqrt(
    a.reduce((s, p, i) => s + dot(sub(p, b[i]), sub(p, b[i])), 0) / a.length,
  );

export function parsePdb(text) {
  if (
    typeof text !== "string" ||
    new TextEncoder().encode(text).length > MAX_PDB_BYTES
  )
    throw Error("Each PDB file must be at most 3 MB.");
  const atomMap = new Map();
  let model = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("MODEL ")) {
      if (model) break;
      model = true;
      continue;
    }
    if (line.startsWith("ENDMDL")) break;
    if (!line.startsWith("ATOM  ") || ![" ", "A"].includes(line[16])) continue;
    const atom = line.slice(12, 16).trim(),
      element = line.slice(76, 78).trim() || atom.replace(/^\d/, "")[0];
    if (["H", "D"].includes(element)) continue;
    const chain = line[21],
      number = Number(line.slice(22, 26)),
      insertion = line[26]?.trim() ?? "",
      resname = line.slice(17, 20).trim();
    const fields = [
      line.slice(22, 26),
      ...[30, 38, 46].map((i) => line.slice(i, i + 8)),
    ];
    if (fields.some((v) => !v.trim()))
      throw Error("PDB contains empty coordinates or residue numbers.");
    const xyz = fields.slice(1).map(Number);
    if (
      line.length < 54 ||
      !Number.isInteger(number) ||
      xyz.some((v) => !Number.isFinite(v) || Math.abs(v) > 100000)
    )
      throw Error("PDB contains invalid atom coordinates or residue numbers.");
    const key = JSON.stringify([chain, number, insertion, atom]),
      previous = atomMap.get(key);
    if (previous && previous.altloc === line[16])
      throw Error("PDB contains duplicate atom identities in its first model.");
    if (!previous || line[16] === " ")
      atomMap.set(key, {
        atom,
        chain,
        number,
        insertion,
        resname,
        aa: letters[resname] ?? "X",
        xyz,
        element,
        altloc: line[16],
      });
    if (atomMap.size > 30000)
      throw Error("At most 30,000 heavy atoms are supported per file.");
  }
  if (!atomMap.size)
    throw Error("No supported ATOM records found. Open a PDB coordinate file.");
  const chains = new Map();
  for (const atom of atomMap.values()) {
    if (!chains.has(atom.chain)) chains.set(atom.chain, new Map());
    const residues = chains.get(atom.chain),
      key = JSON.stringify([atom.number, atom.insertion]);
    if (!residues.has(key))
      residues.set(key, {
        number: atom.number,
        insertion: atom.insertion,
        aa: atom.aa,
        resname: atom.resname,
        atoms: [],
      });
    const residue = residues.get(key);
    if (residue.aa !== atom.aa)
      throw Error("Ambiguous residue identity in the selected model.");
    residue.atoms.push(atom);
  }
  return {
    chains: [...chains].map(([id, rs]) => ({
      id,
      residues: [...rs.values()],
      sequence: [...rs.values()].map((r) => r.aa).join(""),
    })),
  };
}

// Horn's proper quaternion rotation, with a Jacobi eigensolve of the 4×4 symmetric matrix.
export function fitRigid(moving, reference) {
  if (moving.length !== reference.length || moving.length < 3)
    throw Error("At least three matching alignment atoms are required.");
  const cm = mean(moving),
    cr = mean(reference),
    p = moving.map((v) => sub(v, cm)),
    q = reference.map((v) => sub(v, cr));
  for (const cloud of [p, q]) {
    const axis = cloud.reduce((a, b) => (norm(a) > norm(b) ? a : b));
    if (!cloud.some((v) => norm(cross(axis, v)) > 1e-6))
      throw Error("Alignment atoms are collinear.");
  }
  const s = Array.from({ length: 3 }, (_, i) =>
    Array.from({ length: 3 }, (_, j) =>
      p.reduce((sum, v, k) => sum + v[i] * q[k][j], 0),
    ),
  );
  const [xx, xy, xz] = s[0],
    [yx, yy, yz] = s[1],
    [zx, zy, zz] = s[2];
  const a = [
    [xx + yy + zz, yz - zy, zx - xz, xy - yx],
    [yz - zy, xx - yy - zz, xy + yx, zx + xz],
    [zx - xz, xy + yx, -xx + yy - zz, yz + zy],
    [xy - yx, zx + xz, yz + zy, -xx - yy + zz],
  ];
  const vectors = Array.from({ length: 4 }, (_, i) =>
    Array.from({ length: 4 }, (_, j) => (i === j ? 1 : 0)),
  );
  for (let iteration = 0; iteration < 80; iteration++) {
    let i = 0,
      j = 1;
    for (let r = 0; r < 4; r++)
      for (let c = r + 1; c < 4; c++)
        if (Math.abs(a[r][c]) > Math.abs(a[i][j])) {
          i = r;
          j = c;
        }
    if (Math.abs(a[i][j]) < 1e-12) break;
    const angle = 0.5 * Math.atan2(2 * a[i][j], a[j][j] - a[i][i]),
      c = Math.cos(angle),
      t = Math.sin(angle),
      ii = a[i][i],
      jj = a[j][j],
      ij = a[i][j];
    for (let k = 0; k < 4; k++)
      if (k !== i && k !== j) {
        const ki = a[k][i],
          kj = a[k][j];
        a[k][i] = a[i][k] = c * ki - t * kj;
        a[k][j] = a[j][k] = t * ki + c * kj;
      }
    a[i][i] = c * c * ii - 2 * t * c * ij + t * t * jj;
    a[j][j] = t * t * ii + 2 * t * c * ij + c * c * jj;
    a[i][j] = a[j][i] = 0;
    for (let k = 0; k < 4; k++) {
      const vi = vectors[k][i],
        vj = vectors[k][j];
      vectors[k][i] = c * vi - t * vj;
      vectors[k][j] = t * vi + c * vj;
    }
  }
  let largest = 0;
  for (let i = 1; i < 4; i++) if (a[i][i] > a[largest][largest]) largest = i;
  const [w, x, y, z] = vectors.map((row) => row[largest]);
  const rotation = [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
  const apply = (point) =>
    rotation.map((row, i) => dot(row, sub(point, cm)) + cr[i]);
  return {
    rotation,
    movingCenter: cm,
    referenceCenter: cr,
    rmsd: rmsd(moving.map(apply), reference),
    apply,
  };
}
const getChain = (parsed, id) => {
  const c = parsed.chains.find((c) => c.id === id);
  if (!c) throw Error("Choose an existing chain for each role.");
  if (c.sequence.includes("X"))
    throw Error("Assigned chains must contain standard amino acids.");
  return c;
};
const ca = (residue) => residue.atoms.find((a) => a.atom === "CA");
const pdbText = (chains) => {
  let serial = 0;
  const lines = [];
  for (const [chain, residues] of chains)
    for (let i = 0; i < residues.length; i++)
      for (const atom of residues[i].atoms) {
        const atomName =
          atom.atom.length < 4 ? ` ${atom.atom.padEnd(3)}` : atom.atom;
        lines.push(
          `ATOM  ${String(++serial).padStart(5)} ${atomName} ${atom.resname.padStart(3)} ${chain}${String(i + 1).padStart(4)}    ${atom.xyz.map((v) => v.toFixed(3).padStart(8)).join("")}  1.00  0.00          ${atom.element.padStart(2)}`,
        );
      }
  return lines.join("\n") + "\nEND\n";
};
export function compareStructures(normalText, mutantText, assignment) {
  const parsed = [parsePdb(normalText), parsePdb(mutantText)];
  const h = parsed.map((p, i) => getChain(p, assignment[i].hla)),
    peptides = parsed.map((p, i) => getChain(p, assignment[i].peptide));
  if (assignment.some((a) => a.hla === a.peptide))
    throw Error("The HLA and peptide roles must use different chains.");
  if (h[0].sequence !== h[1].sequence)
    throw Error(
      "This first version requires identical observed HLA sequences. Resolve missing residues or HLA differences before comparing.",
    );
  if (h[0].residues.length < 150)
    throw Error(
      "Select the class-I HLA heavy chain (at least 150 observed residues).",
    );
  if (
    peptides.some((c) => c.sequence.length < 8 || c.sequence.length > 14) ||
    peptides[0].sequence.length !== peptides[1].sequence.length
  )
    throw Error("Use equal-length class-I peptides of 8–14 residues.");
  const mutations = [...peptides[0].sequence].flatMap((aa, i) =>
    aa !== peptides[1].sequence[i] ? [i + 1] : [],
  );
  if (mutations.length !== 1)
    throw Error(
      "Use a normal/mutant pair with exactly one amino-acid substitution.",
    );
  const match = h[0].residues.flatMap((r, i) =>
    ca(r) && ca(h[1].residues[i]) ? [i] : [],
  );
  if (match.length < 100)
    throw Error("At least 100 matched HLA Cα atoms are required.");
  const fit = fitRigid(
    match.map((i) => ca(h[1].residues[i]).xyz),
    match.map((i) => ca(h[0].residues[i]).xyz),
  );
  const oriented = peptides.map((c, i) =>
    c.residues.map((r) => ({
      ...r,
      atoms: r.atoms.map((a) => ({ ...a, xyz: i ? fit.apply(a.xyz) : a.xyz })),
    })),
  );
  const differences = oriented[0].map((r, i) => {
    const other = oriented[1][i],
      measure = (names) => {
        const pairs = r.atoms.filter(
          (a) => names(a.atom) && other.atoms.some((b) => b.atom === a.atom),
        );
        return {
          value: pairs.length
            ? rmsd(
                pairs.map((a) => a.xyz),
                pairs.map(
                  (a) => other.atoms.find((b) => b.atom === a.atom).xyz,
                ),
              )
            : null,
          atoms: pairs.map((a) => a.atom),
        };
      };
    return {
      position: i + 1,
      normal: r.aa,
      mutant: other.aa,
      changed: r.aa !== other.aa,
      backbone: measure((name) => ["N", "CA", "C", "O"].includes(name)),
      sidechain:
        r.aa === other.aa
          ? measure((name) => !backbone.has(name))
          : { value: null, atoms: [] },
      sourceResidues: [r, other].map((res, j) => ({
        chain: assignment[j].peptide,
        number: res.number,
        insertion: res.insertion,
      })),
    };
  });
  if (oriented.some((rs) => !ca(rs[0]) || !ca(rs.at(-1))))
    throw Error("Both peptide ends need Cα atoms for a consistent view.");
  const origin = mean(oriented[0].flatMap((r) => r.atoms.map((a) => a.xyz))),
    x = unit(sub(ca(oriented[0].at(-1)).xyz, ca(oriented[0][0]).xyz));
  const up = sub(origin, mean(match.map((i) => ca(h[0].residues[i]).xyz))),
    z = unit(
      sub(
        up,
        x.map((v) => v * dot(up, x)),
      ),
    ),
    y = cross(z, x);
  const display = (point) =>
    [x, y, z].map((axis) => dot(sub(point, origin), axis));
  const files = parsed.map((_, i) =>
    pdbText([
      [
        "A",
        h[i].residues.map((r) => ({
          ...r,
          atoms: r.atoms.map((a) => ({
            ...a,
            xyz: display(i ? fit.apply(a.xyz) : a.xyz),
          })),
        })),
      ],
      [
        "C",
        oriented[i].map((r) => ({
          ...r,
          atoms: r.atoms.map((a) => ({ ...a, xyz: display(a.xyz) })),
        })),
      ],
    ]),
  );
  return {
    mutationPosition: mutations[0],
    sequences: peptides.map((c) => c.sequence),
    differences,
    pdbs: files,
    alignment: {
      atomCount: match.length,
      rmsd: fit.rmsd,
      method:
        "Whole assigned HLA chain; matched observed-sequence positions; Cα fit; proper Horn rotation",
      rotation: fit.rotation,
      movingCenter: fit.movingCenter,
      referenceCenter: fit.referenceCenter,
    },
    policy:
      "First PDB model; heavy ATOM records; blank/A altloc, blank preferred. Identical observed HLA sequences; one peptide substitution. Source roles are assigned by the user. Display chains A/C and residue positions are normalized; source residue identities are preserved. Side-chain comparisons use common named atoms at unchanged residues, without symmetry remapping. This is static geometry, not a binding or immune-response prediction.",
  };
}
