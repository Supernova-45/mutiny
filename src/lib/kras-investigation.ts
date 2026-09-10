import { validView } from "./investigation";
export type KrasScene = "peptide" | "contacts" | "receptor";
export type KrasPrediction =
  | "normal"
  | "mutant"
  | "similar"
  | "cannot-infer"
  | null;
export interface KrasInvestigation {
  kind: "mutiny-kras-investigation";
  version: 1;
  evidenceSha256: string;
  prediction: KrasPrediction;
  revealed: boolean;
  view: {
    scene: KrasScene;
    residue: number;
    overlay: boolean;
    camera: number[] | null;
  };
}
export function parseKrasInvestigation(
  text: string,
  evidenceSha256: string,
): KrasInvestigation {
  const d = JSON.parse(text),
    v = d?.view;
  if (d?.kind !== "mutiny-kras-investigation" || d.version !== 1)
    throw Error("Choose a saved KRAS investigation.");
  if (d.evidenceSha256 !== evidenceSha256)
    throw Error("This investigation uses different source evidence.");
  if (
    !v ||
    !["peptide", "contacts", "receptor"].includes(v.scene) ||
    !Number.isInteger(v.residue) ||
    v.residue < 1 ||
    v.residue > 10 ||
    typeof v.overlay !== "boolean" ||
    (v.camera !== null && !validView(v.camera)) ||
    typeof d.revealed !== "boolean" ||
    !["normal", "mutant", "similar", "cannot-infer", null].includes(
      d.prediction,
    )
  )
    throw Error("Invalid KRAS investigation or camera.");
  return d;
}
