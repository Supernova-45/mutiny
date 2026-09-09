# mutiny — Rosalind handoff

Repository: https://github.com/Supernova-45/mutiny

Product: **mutiny — Cancer vaccine explorer**.

New direction: prepare a reusable research workflow as well as the existing worked example. Read `outputs/RESEARCH_TOOL_PLAN.md`; the scoped additions below supersede the earlier demo-only software scope. The existing cohort and structural study keep their original scientific boundaries.

## Paste into the Rosalind-enabled account

> Continue mutiny from https://github.com/Supernova-45/mutiny. Read outputs/ROSALIND_HANDOFF.md and docs/SCIENCE.md. Use the actual Rosalind Workbench and connected scientific plugins available in this account to produce the scientific evidence for a new interactive mechanism story: how the HHAT L75F mutation changes the peptide surface encountered by the 302TIL T-cell receptor. The goal is new measured, source-linked artifacts that drive the demo, beyond auditing existing files. First verify available capabilities and report exact plugin names. Independently reconstruct and compare the four experimental HHAT structures; quantify position-6 geometry relative to the HLA scaffold; extract the paper’s experimentally measured receptor-binding and peptide–HLA results without conflating assay types; export mechanism.json, evidence.json, executable analysis, and real Workbench screenshots. Also check a retrospective top-k response-capture dataset for the existing vaccine cohort. Preserve all exclusions and keep the ovarian structural case distinct from the pancreatic vaccine trial. No new model training, simulated molecular trajectories, invented numbers, or app redesign. Return a ZIP or commit for integration in the original account. Complete supported tasks and explicitly mark unsupported ones. Also read outputs/RESEARCH_TOOL_PLAN.md and complete section 6 of this handoff: propose portable project/evidence schemas and validate them on the existing example plus an independent permissible fixture. The result should support researchers bringing their own candidate tables, scores and optional outcomes. Do not build the generic frontend in this account.

## What this must add

The existing app can rotate structures and display scores. The new contribution must answer a biological question with inspectable evidence: **How can changing one part of a tumor peptide change what a T cell recognizes?**

Rosalind should produce the measurements and source-backed interpretation for three interactions: highlight the mutation, inspect the neighboring Trp6 surface, and compare receptor-free with receptor-bound experimental structures. A contribution badge alone is insufficient.

## 1. Capability check and inputs

List exact available plugins, tools, versions where available, and supported operations. Prefer native sequence/alignment/structure viewers and evidence retrieval where available. If numeric analysis runs in Python through Workbench, describe it exactly that way. Do not assume a dedicated molecular-measurement plugin or GPT-Rosalind model access. If the account only supports sequencing workflows, report that this structural task needs additional capabilities; do not invent an unrelated sequencing analysis.

All required inputs are public and cached. No credentials, patient uploads, model downloads or paid datasets are needed for the core task. Clone/download the repo; the existing app runs with Node.js 22, `npm ci`, `npm run dev`. If this account cannot run the app, return analysis files for integration elsewhere.

Read:
- `docs/SCIENCE.md` and `docs/ROSALIND_VALIDATION_REFERENCE.md`.
- Devlin et al. 2020: https://www.nature.com/articles/s41589-020-0610-1 ; full text https://pmc.ncbi.nlm.nih.gov/articles/PMC8210748/ .
- Original PDBs in `data/raw/`; prepared coordinates in `public/structures/`; existing measurements in `public/data/structures.json`.
- Rojas et al. 2023: https://www.nature.com/articles/s41586-023-06063-y ; original Supplementary Table 5 in `data/raw/rojas-2023-table5.xlsx`.

## 2. Primary result: the HHAT mechanism

### Reconstruct first

Normal peptide KQWLVWLLL; mutant KQWLVWLFL. HHAT L75F maps to peptide position 8. Position 6 is tryptophan (W6). HLA-A*02:06 throughout.

| State | Normal | Mutant |
|---|---|---|
| Receptor-free pMHC | 6UJQ | 6UJO |
| Receptor-bound | 6UK2 | 6UK4 |

The bound asymmetric units do not directly contain the contacting receptor interface. Independently verify the deposited symmetry and crystal-mate recovery: identity rotation plus translations of receptor chains D/E by (+a, −b, 0) for 6UK2 and (0, +b, 0) for 6UK4. Do not mistake separated biological-assembly listings for the contacting complex. Verify chain assignments from the deposited sequence; preserve residue numbering.

Align all states using HLA chain A Cα residues 1–180, with 6UJQ as reference. Do not align the peptide to make the effect look larger or smaller. Use identical atom/missingness/alternate-location policies. Report fit residuals and sensitivity to another reasonable HLA-only alignment selection.

### New measurements

1. **Where the change appears:** for each peptide position, measure normal-versus-mutant displacement of matching backbone atoms in the receptor-free pair and in the bound pair. For shared amino acids, separately report matching side-chain heavy-atom RMSD. Do not compute a whole-side-chain L/F RMSD using unmatched atoms.
2. **The W6 comparison:** compare position-6 indole heavy-atom geometry in each receptor-free structure with its own receptor-bound counterpart, after the HLA fit. Return the exact atom lists, RMSDs and, if useful, documented side-chain torsions. Do not assume in advance that any chosen scalar will reproduce the paper’s qualitative interpretation.
3. **The receptor interface:** verify the W6–Tyr100α contact and report exact atom/centroid endpoints. Preserve the distinction between minimum heavy-atom distance and ring-centroid distance (the latter is approximately 3.31 Å in the existing preparation). Include positions 6 and 8, unique receptor contacts ≤4 Å, and the source coordinates for drawing distance lines.
4. **Accessibility:** independently check position-6/8 whole-residue SASA using the existing documented method, or document a supported alternative. Separate pMHC-only accessibility from receptor-complex accessibility. Never compare whole-residue areas directly with the paper’s hydrophobic side-chain areas.

Export `rosalind/mechanism.json`, with schema version, input hashes, coordinate frame, state IDs, alignment selections, per-residue measurements and units, missing values as null with reasons, display atom selections and contact endpoints. Supply the executable analysis and environment information. Do not replace existing display coordinates silently: provide proposed corrections separately.

### Experimental evidence, not just geometry

Extract exact published measurements that support the biological interpretation: normal/mutant TCR affinity or kinetics, and the peptide–HLA assay results. Preserve assay identity, conditions, units, uncertainty, censoring and table/figure location. Thermal stability must remain thermal stability; do not relabel it as affinity. Do not convert a figure’s qualitative result into an invented number. If only a visual estimate is possible, mark it as such and exclude it from the default numeric display.

Export `rosalind/evidence.json`: each fact has a stable ID, claim, evidence type (published experiment / computed geometry / interpretation), source URL and figure/table location, exact values where available, and limitations. Distinguish the paper’s dynamic/pre-organization mechanism from what four static crystal structures alone establish. Distances and contact counts are not binding energies or immune-response probabilities.

The app may then show the experimental contrast between peptide–HLA behavior and receptor recognition, alongside the structural evidence. If any headline is unsupported, return a more accurate one.

## 3. Secondary result: a retrospective response-capture interaction

Create `rosalind/response-capture.json` for all patients, each existing ordering, and k=1 through the number of comparable targets for that patient. At each k return target IDs, individually detected responses recovered, total eligible responses and the pointwise central 90% reference from 2,000 seeded within-patient shuffles. Explicitly record tie-breaking rules and reuse the same eligible targets across orderings.

This asks: **Among the targets already administered, how early does each ordering recover the measured responses?** It is not a simulated vaccine, prospective target selection, clinical benefit, or comparison to Omnii.

Preserve the cohort: 232 records; 23 individually positive, 200 non-detected, seven unresolved pool members, two missing. All 232 records have both predicted class-I and class-II annotations; these do not establish the responding HLA class. Current joint comparison: 188 records, 22 positive and 166 non-detected. Target 10:39 remains visible but excluded due to unresolved reference mapping. Do not call this a class-I immunogenicity benchmark or pick a favorable patient as evidence of general model performance.

Use the existing order directions and seeded reference method in `src/lib/statistics.mjs`, with an independent small-case check. Cross-check source labels before computing. Do not rescore ESM/MHCflurry or expand the cohort.

## 4. Return package

- `rosalind/mechanism.json`, `evidence.json`, and `response-capture.json` (or explicit unsupported-result reports).
- Executable analysis, environment and source hashes.
- `rosalind/REVIEW.md`: conclusions supported, conclusions not supported, discrepancies, proposed corrections. Keep the narrative concise.
- `rosalind/CONTRIBUTIONS.md`: exact plugins/tools, actual operations, inputs, output paths and execution references. Separate native tools from custom code.
- Real screenshots of Workbench evidence retrieval, structural inspection and the resulting measurements. Screenshots must show work performed, not a staged interface.
- A short approved narration/claim list for the demo, with claim IDs pointing into `evidence.json`.
- One ZIP or commit. No credentials or private chat history.

Minimum substantive success: independently reconstructed interface, at least one new validated geometry comparison, and source-backed experimental interpretation that can drive the interactive story. A count audit alone does not complete the new handoff. Complete the structural result before optional reference rescue or additional analyses.

## 5. Integration boundary

The original account builds the interaction, captioned video and deployment package from the returned evidence. See `outputs/DEMO_PLAN.md`. It will retain the two studies as separate evidence, verify the files, and only then update the Rosalind attribution. Actual Workbench screenshots and exact plugins are needed for the showcase. No social submission or deployment is authorized by this handoff.

This is an original interactive synthesis of published findings, not a claim to have discovered the HHAT mechanism or validated a new vaccine predictor.


## 6. New product task: make the scientific output reusable

The requested product is a visual review workspace for cancer-vaccine research. It accepts researchers' existing candidate lists and scores; it helps them inspect ranking differences and evidence and export a reproducible review. The existing worked examples remain available. This is not authorization to create a clinical selection engine.

### Additional bounded deliverables

1. `rosalind/project.schema.json` and a small example package: candidate identities and grouping, declared analysis unit, prediction rows and method semantics, optional assay/outcome rows, source provenance, notes and exclusions. Separate target/variant identity from peptide–HLA identity. Specify how outcome joins avoid duplicating an assay result across multiple candidate rows. Scores require endpoint, units, direction and version; missing outcomes remain missing.
2. `rosalind/evidence-pack.schema.json`: exact candidate joins; sequence/reference reconciliation; sources and claim IDs; evidence type; measured versus predicted structure; chain/allele/peptide mapping; coordinate-frame metadata; measurements and uncertainty; contribution provenance. Design the HHAT `mechanism.json` as one instance of the reusable evidence contract, rather than a special biological assumption applied to every target.
3. `rosalind/fixtures/`: normalize the existing Rojas example and identify one independently sourced, license-compatible unlabeled candidate fixture. pVACtools' documented HCC1395 demonstration is one option; verify the specific source/version and reuse terms. Do not fabricate response labels or download whole sequencing datasets. Return source hashes, transformation scripts, declared losses and a validation report. If reuse terms or access cannot be verified, report that blocker and complete the schema/existing-fixture work.
4. `rosalind/PRODUCT_REVIEW.md`: assess whether a researcher can bring a candidate table, compare rankings, investigate evidence and export a review. Check against pVACview's existing features. Identify where mutiny adds value and where it duplicates existing tools. State which real-user assumptions remain untested.

Keep the first release narrow: CSV/TSV import, declared score semantics, linked rankings, optional outcome evaluation, research notes, evidence-package import and lossless project export/reopen. Full pVACseq support, automatic structure generation and hosted patient-data services are later work.

The original account implements the importer, general project engine, browser-local data handling, UI and export. This account supplies reusable scientific contracts, evidence and fixture validation using actual supported Workbench operations. Package this work with the structural deliverables; do not postpone all useful output because one optional capability is missing.
