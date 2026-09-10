# Focused structural return — 2026-09-10

Start with [comparison-review/README.md](comparison-review/README.md) and [contrast-kras/case.json](contrast-kras/case.json). Scientific changes are confined to `rosalind/`; frontend and generated assets remain the original account's responsibility.

Completed:

- Independent HHAT whole-HLA and per-residue numerical review, pinned to an unmodified engine snapshot; 12 executable fixtures, source/display identity checks, proper-rotation checks and exact expected outputs.
- An independent KRAS G12D contrast with original deposits and hashes, same engineered receptor identity, source-extracted SPR assays, explicit mapping/exclusions, platform sensitivity analysis, complete peptide-copy coverage, choice/reveal fields, redistribution terms and native contact render.
- Actual Molecular Structure Viewer Cα alignment, atom queries, scoped contact measurements and PNG publication; Biological Sequence & Alignment Viewer peptide queries; Life Sciences Literature PMC retrieval. Exact receipts distinguish native and local calculations.
- A versioned structural mapping proposal that preserves the strict current importer. KRAS is scientifically curated but still correctly rejected by that importer; no silent residue deletion or frontend preset was made.
- Preserved earlier second-return work: four-state wwPDB residue validation, three real HCC1395 evidence returns and tested evidence-identity proposal. See [SECOND_RETURN.md](SECOND_RETURN.md). Those broader contracts are deferred, not a newly shipped importer.

Blocked: public-density loading still reports unbound workspace-read roots. No supported binding operation was exposed. Native image publication does not grant read roots. No density map was loaded, inspected or exported; no local map volume, contour, grid or transform is claimed. Whole-residue validation remains source-reported support, not side-chain certainty. No whole-Workbench screenshot is claimed.

Validation performed:

- `run_structural_review.sh`: all 12 fixture comparisons, independent KRAS mapping/contacts/source checks pass.
- `run_second_return.sh`: 21 exchange tests, three schemas and six verification groups pass; regenerated results retain cohort exclusions and human review state.
- Current repository Node tests: 12 pass; `tests/project.test.mjs` cannot start because this checkout lacks the `ajv` dependency. This is a missing local dependency, not a passed test or a scientific regression. No frontend dependency or build files were changed to conceal it.

The contrast's central caution is deliberate: similar bound structures accompany over 4,000-fold measured receptor selectivity. RMSD and short atomic distances cannot determine that affinity ratio. The engineered KRAS reagent, ovarian HHAT case and pancreatic vaccine cohort remain distinct. No predictions, trajectories, training, video or app redesign were produced.
