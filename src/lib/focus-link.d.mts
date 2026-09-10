export interface FocusView {
  version: 1;
  caseId: "hhat" | "kras";
  step: number;
  residue: number;
  mode: "normal" | "mutant" | "both";
  context?: boolean;
  density: boolean;
  contour: number;
  sources: string;
  camera: number[] | null;
}
export function parseFocusLink(hash: string): FocusView | null;
export function focusLink(base: string, state: FocusView): string;
