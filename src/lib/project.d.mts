export interface Candidate {
  id: string;
  groupId: string;
  sequenceId: string;
  gene: string | null;
  hla: string | null;
  sourceId: string;
  [key: string]: unknown;
}
export interface Method {
  id: string;
  endpoint: string;
  unit: string;
  direction: "ascending" | "descending";
  version: string;
  versionStatus: string;
  semantics: string;
}
export interface Score {
  candidateId: string;
  methodId: string;
  value: number | null;
  status: string;
  sequenceId: string | null;
  hla: string | null;
  context: string;
}
export interface Project {
  schemaVersion: string;
  projectId: string;
  title: string;
  analysisUnit: string;
  groups: { id: string; label: string }[];
  candidates: Candidate[];
  sequences: {
    id: string;
    sequence: string;
    role: string;
    reference: string | null;
  }[];
  methods: Method[];
  scores: Score[];
  outcomes: unknown[];
  sources: { id: string; url: string; license: string | null }[];
  annotations: {
    kind?: string;
    candidateId?: string;
    note?: string;
    status?: string;
    [key: string]: unknown;
  }[];
  view: Record<string, unknown>;
  [key: string]: unknown;
}
export interface RankedRow {
  candidate: Candidate;
  scores: Score[];
}
export const MAX_PROJECT_BYTES: number;
export function parseProject(text: string): Project;
export function validateProject(input: unknown): Project;
export function compareProject(
  project: Project,
  groupId: string,
  methodA: string,
  methodB: string,
  k?: number,
): {
  orders: RankedRow[][];
  excluded: { candidate: Candidate; reason: string }[];
  overlap: number;
  k: number;
  tied: boolean;
  eligible: number;
};
export function saveReview(
  project: Project,
  candidateId: string,
  patch: { status?: string; note?: string },
): Project;
export function safeSourceUrl(value: string): string | null;
