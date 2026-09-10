# Rosalind handoff: one focused structural-comparison tool

**Status, 2026-09-10:** [The structural return](../rosalind/STRUCTURAL_RETURN.md) delivered independent validation and the curated KRAS case. Both are reviewed; KRAS now has a dedicated frontend comparison using the explicit shared-HLA mapping. Generic uploaded-pair rules remain unchanged. Experimental density remains blocked by unavailable Workbench read roots. The tasks below retain the original scientific request; do not repeat completed work.

Current product direction: **compare a normal and cancer-mutant peptide structure; inspect what changes beyond the mutation.** This supersedes the broad dashboard expansion in earlier handoffs. Keep existing scientific returns; prioritize the tasks below. These are documented requests for a later Rosalind session, not operations executed by this account.

## What the app now does

- Opens with the curated HHAT example. Visitors can predict normal/mutant receptor binding, reveal the published measurements, inspect mutation → W6 → receptor contact, and save a source-captioned figure or reopenable investigation. The finding text box has been removed; preserve compatibility with notes in older saved files. Predictions belong to the visitor; experimental evidence remains fixed.
- Accepts two local PDB files with assigned HLA and peptide chains. The first release requires identical observed HLA sequences, equal-length 8–14-residue peptides, and exactly one peptide substitution. It fits matched Cα atoms over the entire assigned HLA chain using a proper quaternion rotation. It never fits the peptide.
- Displays per-residue common-atom side-chain or backbone RMSD. Side-chain RMSD at the mutation is unavailable because amino acids differ. Symmetric atom names are not remapped. Author residue identities are retained separately from normalized display chains A/C and positions.
- Marks uploaded coordinate provenance and receptor state as supplied by the user, without claiming independent biological validation. Saved files embed original inputs and hashes. No uploaded structure receives HHAT assays or a receptor-binding prediction.

The upload engine is new local code (`src/lib/structure-pair.mjs`), not a previously verified Workbench operation. Its whole-HLA HHAT fit (275 Cα, approximately 1.027003 Å) agrees with a separate NumPy Kabsch calculation. The curated HHAT view continues to use the independently reviewed platform alignment and fixed-ring measurements; those metrics must not be substituted for the generic whole-chain/common-atom results.

## Priority 1 — independently check the reusable comparison

Use Molecular Structure Viewer and Biological Sequence & Alignment Viewer where their live capabilities support it. Validate one actual normal/mutant pair, starting with 6UJQ/6UJO and then one independent pair. Verify chain assignment, observed sequence mapping, alternate-location handling, proper rigid alignment and source-to-display residue identities. Check the whole-chain fit and the residue-wise measurements against independent calculations; identify where a platform-only fit would be more defensible.

Return fixtures and exact expectations for: different author chain names; shifted residue numbering/insertion codes; missing HLA residues; predicted versus experimental coordinates; different receptor-bound states; missing peptide side-chain atoms; and symmetric aromatic atom naming. Some are expected to be rejected by this deliberately narrow release. Do not broaden accepted inputs by silently inventing missing residues or atom correspondences. Propose explicit versioned rules and explain their biological consequences.

Return source-linked findings, files, hashes, exact plugin operations and limitations. Keep native measured atom distances, locally computed residue RMSD, and source-reported validation separate. Do not call a generic common-side-chain RMSD the HHAT fixed-indole-ring RMSD.

## Priority 2 — inspect experimental density

Continue the existing four-state density task in `outputs/ROSALIND_FOLLOWUP.md`, section 1. First resolve the supported workspace binding for an authentic deposited structure. Inspect and, where supported, export a small local map around W6/P8, including channel, contour units, grid/map transforms, source coordinate hashes and attribution. Native renders are useful but are not interactive volume assets. Never attach deposited-frame maps to transformed comparison PDBs without the matching verified transform.

Start with one usable map pair and document its limits. If blocked, return completed checks and a precise status. Map availability alone does not constitute an inspected or usable overlay. Report whole-residue validation metrics accurately; they are not side-chain certainty scores.

## Priority 3 — one additional accessible cancer case

Look for one public, experimentally grounded normal/cancer-mutant peptide–HLA case with a coherent question different from HHAT. Prefer a direct change in receptor contact or an HLA-anchor mechanism, supported by compatible deposited structures and comparable experiments. Return one strong case, not a large catalog. If no case meets the requirements, document the search and stop.

### Verified leads from the external critique (2026-09-10)

Prioritize **KRAS G12D as a contrasting second case**, pending the checks below. [Poole et al., Nature Communications 2022](https://www.nature.com/articles/s41467-022-32811-1) reports the same affinity-enhanced JDIa41b1 TCR bound to wild-type [7OW5](https://www.rcsb.org/structure/7OW5) and mutant [7OW6](https://www.rcsb.org/structure/7OW6) peptide–HLA-A*11:01. The reported affinities are 3.0 μM versus 743 ± 18 pM, respectively: over 4,000-fold selectivity despite similar bound structures. Preserve the engineered-TCR identity; do not substitute the parent TCR's affinities or imply vaccine efficacy. The accessible question is: **similar-looking structures, very different binding—what can a structure comparison actually tell us?** The paper's thermodynamic and simulation interpretation is separate from what our static viewer measures.

The local importer was tested on unmodified public PDB downloads. 7OW5 has 275 observed HLA A residues, 7OW6 has 276; A/C assignments fail the current identical-observed-sequence requirement. This is not a drop-in preset. Independently establish correspondence and propose an explicit versioned missing-residue/platform-fit rule, preserving the originals and reporting excluded positions. Do not silently delete residues to pass validation. The paper also reports free pHLA structures 7OW3/7OW4 with incomplete central peptide density: those require separate coverage checks and do not justify displaying an invented complete pose. The generic importer currently omits TCR chains from its display, so presenting receptor contacts requires a curated viewer integration as well.

A possible p53 alternative uses wild-type [6VR1](https://www.rcsb.org/structure/6VR1) and mutant [6VR5](https://www.rcsb.org/structure/6VR5), described in [Wu et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7283474/). A/P assignments fail observed-HLA equality (275 versus 274 residues); D/Q assignments pass the current numerical checks with 275 Cα and whole-HLA RMSD 0.205583 Å. This is a numerical acceptance check only: independently verify chain pairing, assembly, residue mapping, source-quality and selection justification before curating the case. The critique's 6VRM/6VRN entries are different TCRs bound to mutant peptide, not a normal/mutant pair. Its `6QVO` is unrelated MTH1; the p53 TCR accession is `6VQO`.

These observations came from local public-coordinate checks and paper/database research, not a new Rosalind execution. Source copies are in ignored `work/preset-review/`; retrieve and hash originals in the scientific return. Add one complete contrast, not a broad atlas. Do not claim HHAT is unique among cancer neoantigens without an explicit current search and completeness definition.

Required package: cancer context; exact gene/variant and peptide/HLA identities; normal and mutant coordinates; receptor-bound states; primary paper and precise assay locations; measured versus predicted evidence; data/asset redistribution terms; one concise visitor question and an answer the experiments actually support. Include a predeclared choice/reveal mapping without overstating vaccine efficacy. A gene match alone is insufficient.

Do not add a cancer-type selector until another complete case is ready. Do not imply visitors are receiving personalized medical predictions. The current personalization is their hypothesis and saved molecular scene.

## Deferred

General HCC1395 evidence enrichment, dashboard expansion, CSV/ZIP project adapters, automatic vaccine selection, arbitrary TCR docking, new model training and RNA cassette design. The existing candidate reviewer remains available as a secondary tool. Retain previous schema findings for later; they need not delay this narrower comparison release.

No video, narration, captions, storyboard or player work. Those remain with the original account after the completed app is ready.

Work in `rosalind/` and return the commit SHA when eventually executed. Leave frontend code and generated `public/` projections to the original account. Do not relabel local work as plugin execution, and do not bypass denied capabilities.
