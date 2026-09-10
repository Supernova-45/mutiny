export interface Chain {
  id: string;
  sequence: string;
  residues: {
    aa: string;
    number: number;
    insertion: string;
    atoms: unknown[];
  }[];
}
export interface Assignment {
  hla: string;
  peptide: string;
}
export interface Difference {
  position: number;
  normal: string;
  mutant: string;
  changed: boolean;
  backbone: { value: number | null; atoms: string[] };
  sidechain: { value: number | null; atoms: string[] };
  sourceResidues: { chain: string; number: number; insertion: string }[];
}
export interface PairComparison {
  mutationPosition: number;
  sequences: string[];
  differences: Difference[];
  pdbs: string[];
  alignment: {
    atomCount: number;
    rmsd: number;
    method: string;
    [key: string]: unknown;
  };
  policy: string;
}
export const MAX_PDB_BYTES: number;
export function parsePdb(text: string): { chains: Chain[] };
export function compareStructures(
  normal: string,
  mutant: string,
  assignment: Assignment[],
): PairComparison;
