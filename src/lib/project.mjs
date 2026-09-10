import Ajv2020 from "ajv/dist/2020.js";
import schema from "../../rosalind/project.schema.json" with { type: "json" };

const validateSchema = new Ajv2020({ allErrors: false, strict: false }).compile(
  schema,
);
export const MAX_PROJECT_BYTES = 8 * 1024 * 1024;
const fail = (message) => {
  throw new Error(message);
};
const unique = (rows, key, label) => {
  const seen = new Set();
  for (const row of rows) {
    const id = row[key];
    if (seen.has(id)) fail(`Duplicate ${label}: ${id}`);
    seen.add(id);
  }
  return seen;
};
export function validateProject(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("Open a normalized mutiny project JSON file.");
  if (input.candidates?.length > 10000 || input.scores?.length > 100000)
    fail("This release supports up to 10,000 candidates and 100,000 scores.");
  if (!validateSchema(input)) {
    const issue = validateSchema.errors[0];
    fail(
      `Project format: ${issue.instancePath || "/"} ${issue.message}. Expected schema 0.1.0.`,
    );
  }
  const ids = unique(input.candidates, "id", "candidate ID");
  const groups = unique(input.groups, "id", "group ID");
  const sequences = unique(input.sequences, "id", "sequence ID");
  const methods = unique(input.methods, "id", "method ID");
  const sources = unique(input.sources, "id", "source ID");
  const assays = unique(input.outcomes, "assayId", "assay ID");
  for (const c of input.candidates) {
    if (
      !groups.has(c.groupId) ||
      !sequences.has(c.sequenceId) ||
      !sources.has(c.sourceId)
    )
      fail(`Broken group, sequence or source reference: ${c.id}`);
  }
  for (const m of input.methods)
    if (!sources.has(m.sourceId)) fail(`Unknown method source: ${m.id}`);
  const scored = new Set();
  for (const s of input.scores) {
    if (
      !ids.has(s.candidateId) ||
      !methods.has(s.methodId) ||
      (s.sequenceId !== null && !sequences.has(s.sequenceId))
    )
      fail(`Broken score reference: ${s.candidateId}`);
    if (s.status === "available" && !Number.isFinite(s.value))
      fail(`Non-finite score: ${s.candidateId}`);
    const key = JSON.stringify([
      s.candidateId,
      s.methodId,
      s.sequenceId,
      s.hla,
      s.context,
    ]);
    if (scored.has(key))
      fail(`Duplicate score context: ${s.candidateId} / ${s.methodId}`);
    scored.add(key);
  }
  for (const a of input.outcomes)
    if (!groups.has(a.groupId) || !sources.has(a.sourceId))
      fail(`Broken experiment reference: ${a.assayId}`);
  for (const member of input.assayMembers)
    if (!ids.has(member.candidateId) || !assays.has(member.assayId))
      fail(`Broken assay membership: ${member.candidateId}`);
  for (const e of input.exclusions)
    if (!ids.has(e.candidateId))
      fail(`Unknown excluded candidate: ${e.candidateId}`);
  for (const a of input.annotations) {
    if (
      a.kind === "mutiny-review" &&
      (!ids.has(a.candidateId) ||
        typeof a.note !== "string" ||
        !["unreviewed", "investigate", "reviewed"].includes(a.status))
    )
      fail("Invalid mutiny review annotation.");
  }
  return input;
}
export function parseProject(text) {
  if (new TextEncoder().encode(text).length > MAX_PROJECT_BYTES)
    fail("Project exceeds the 8 MB JSON limit.");
  let input;
  try {
    input = JSON.parse(text);
  } catch {
    fail("This file is not valid JSON. Open a normalized mutiny project.");
  }
  return validateProject(input);
}
const compareIds = (a, b) => {
  const x = Array.from(a),
    y = Array.from(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const delta = x[i].codePointAt(0) - y[i].codePointAt(0);
    if (delta) return delta;
  }
  return x.length - y.length;
};
export function compareProject(project, groupId, methodA, methodB, k = 5) {
  const candidates = project.candidates.filter((c) => c.groupId === groupId);
  const methods = [methodA, methodB].map((id) =>
    project.methods.find((m) => m.id === id),
  );
  if (methods.some((m) => !m))
    return {
      orders: [[], []],
      excluded: candidates.map((c) => ({
        candidate: c,
        reason: "Choose two score methods.",
      })),
      overlap: 0,
      k: 0,
      tied: false,
      eligible: 0,
    };
  const index = new Map();
  for (const score of project.scores) {
    const key = JSON.stringify([score.candidateId, score.methodId]);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(score);
  }
  const excluded = [],
    accepted = [];
  for (const candidate of candidates) {
    const scores = methods.map(
      (m) => index.get(JSON.stringify([candidate.id, m.id])) ?? [],
    );
    let reason = null;
    if (
      project.exclusions.some(
        (e) =>
          e.candidateId === candidate.id &&
          ["comparison", "all"].includes(e.scope),
      )
    )
      reason = "Excluded by project";
    else if (scores.some((s) => s.length > 1))
      reason = "Multiple score contexts; choose a projection before comparing";
    else if (scores.some((s) => s.length !== 1 || s[0].status !== "available"))
      reason = "Missing or unresolved score";
    else if (
      scores[0][0].sequenceId !== scores[1][0].sequenceId ||
      scores[0][0].hla !== scores[1][0].hla ||
      scores.some((s) => s[0].sequenceId === null)
    )
      reason =
        "Scores refer to different or unresolved sequence / HLA contexts";
    else if (
      ["peptide", "peptide_hla"].includes(project.analysisUnit) &&
      scores[0][0].sequenceId !== candidate.sequenceId
    )
      reason = "Scored sequence differs from the declared peptide";
    else if (
      project.analysisUnit === "peptide_hla" &&
      (!candidate.hla || scores[0][0].hla !== candidate.hla)
    )
      reason = "Scored HLA differs from the declared peptide–HLA candidate";
    if (reason) excluded.push({ candidate, reason });
    else accepted.push({ candidate, scores: scores.map((s) => s[0]) });
  }
  const orders = methods.map((method, i) =>
    [...accepted].sort(
      (a, b) =>
        (method.direction === "ascending" ? 1 : -1) *
          (a.scores[i].value - b.scores[i].value) ||
        compareIds(a.candidate.id, b.candidate.id),
    ),
  );
  const count = Math.min(Math.max(0, Math.floor(k)), accepted.length);
  const first = new Set(orders[0].slice(0, count).map((r) => r.candidate.id));
  const overlap = orders[1]
    .slice(0, count)
    .filter((r) => first.has(r.candidate.id)).length;
  const tied = orders.some(
    (rows, i) =>
      count > 0 &&
      count < rows.length &&
      rows[count - 1].scores[i].value === rows[count].scores[i].value,
  );
  return {
    orders,
    excluded,
    overlap,
    k: count,
    tied,
    eligible: accepted.length,
  };
}
export function saveReview(project, candidateId, patch) {
  if (!project.candidates.some((c) => c.id === candidateId))
    fail("Review candidate is not in this project.");
  const previous = project.annotations.find(
    (a) => a.kind === "mutiny-review" && a.candidateId === candidateId,
  );
  const annotation = {
    ...previous,
    kind: "mutiny-review",
    candidateId,
    status: "unreviewed",
    note: "",
    ...previous,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return {
    ...project,
    annotations: [
      ...project.annotations.filter(
        (a) => !(a.kind === "mutiny-review" && a.candidateId === candidateId),
      ),
      annotation,
    ],
  };
}
export function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
