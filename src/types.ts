export type Outcome = 'response' | 'undetected' | 'pooled' | 'missing';
export type Lens = 'published' | 'esm' | 'binding' | 'shuffle';
export interface Target {
  id: string; patient: number; number: string; gene: string; transcript: string | null;
  mutation: string | null; mutant: string; wildtype: string | null; coding: string;
  hla1: string; epitope1: string; hla2: string; epitope2: string;
  outcome: Outcome; sourceLabel: string; esmMetadataEligible: boolean;
  esm: number | null; binding: number | null; comparisonEligible: boolean;
  proteinMapping: { status: string; reason?: string; proteinAccession?: string; transcriptVersion?: string } | null;
}
export interface Cohort {
  targets: Target[]; source: string; sourceSha256: string;
  models: { esm?: { count: number; revision: string; window: number }; binding?: { count: number; version: string } };
}
export interface ResidueInfo { position: number; name: string; sasa: number; contacts: { residue: string; distance: number }[] }
export interface Structure { id: string; state: string; bound: boolean; peptide: string; platformRmsd: number; alignedSha256:string; residues: ResidueInfo[] }
export interface StructureData { structures: Structure[]; alignment: string; sasa: string; contacts: string }
