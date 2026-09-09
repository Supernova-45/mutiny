# Callback — handoff to the Rosalind-enabled account

Repository: https://github.com/Supernova-45/callback

## Paste this instruction into the other account

> Continue Callback using this repository. Read README.md, docs/SCIENCE.md and this handoff. The application and both model runs already exist. First inspect the actual Rosalind Workbench plugins available in this account; do not assume a capability. Use supported Rosalind tools to independently validate the published target records and the experimental HHAT structural preparation. Produce reproducible outputs, record the exact plugins and operations used, and capture the actual Workbench workflow. Preserve the scientific scope and all unresolved outcomes. Do not redesign the project, train models, fabricate missing values, or claim work that the tools did not perform.

## Start without Astra

Download the public repository ZIP or clone it. The project is ordinary files and does not depend on the originating chat or model. The web app needs Node.js 22: `npm ci`, then `npm run dev`. All results are precomputed; API keys and model weights are unnecessary for viewing it. If this account cannot run a web server, inspect the data and screenshots and return the scientific artifacts as files for integration in the original account.

## What is already complete

- Audited 232 source records and preserved 23 individual positives / 200 non-detected / seven pool members / two missing outcomes.
- Retrieved versioned RefSeq/CDS records and strictly verified 197 source contexts.
- Computed frozen ESM-2 650M scores for those 197 records and MHCflurry affinity estimates for 232 published pairs.
- Matched comparison subset: 188 records, 22 individually positive and 166 non-detected. Positive target 10:39 fails the present reference mapping; its outcome is not altered.
- Prepared four HHAT structures, including crystal-mate recovery, HLA-platform alignment, residue SASA and geometric contacts.
- Built patient maps, response reveal, matched orderings, repeated-shuffle reference, synchronized molecular views and an evidence drawer.

## Required Rosalind contribution

### 0. Verify capabilities

Record exact installed plugin names and the operations actually accessible. Choose supported read-only evidence/sequence/structure analysis tools. If a needed operation is unavailable, mark it unavailable; do not present a generic Python run as a native plugin operation. Python executed through Workbench may be described accurately as such if that is what happens.

### 1. Independently validate the cohort

Use the Rojas article and original Supplementary Table 5 in `data/raw/rojas-2023-table5.xlsx`. Independently reproduce counts and target identity checks, then compare with `outputs/rojas-audit.json` and `public/data/cohort.json`.

Confirm that all 232 rows carry predictions for both HLA classes and that these columns cannot assign the class mediating an ELISpot response. Inspect the pooled-response explanation in Figure 1. Do not convert seven pool members to seven positives or arbitrarily pick two positives. Do not call the whole cohort a class-I benchmark.

Return `rosalind/cohort-validation.json` containing checks, observed values, agreement/disagreement, source locations, plugin names and execution evidence references. Save a short human-readable interpretation alongside it.

### 2. Independently validate the molecular interface

Read Devlin et al. 2020, especially Figure 3, and inspect the raw RCSB PDB files. This is the most valuable scientific review task.

**Do not display the raw asymmetric units as the receptor-bound interface.** Recover the contacting TCR crystal mate from deposited unit-cell translations: 6UK2 chains D/E (+a, −b, 0); 6UK4 chains D/E (0, +b, 0), with identity rotation. Compare these transformations with the supplied prepared coordinates. The deposited biological assembly listings split pMHC and TCR; they alone do not establish the contacting complex.

Verify peptide sequences, chain identities, HLA alignment, the Trp6–Tyr100α interface, and selected position-6/position-8 contacts. If supported, independently reproduce solvent-accessible areas with a documented probe and atom policy. Distinguish method-dependent differences from errors. Areas here include whole residues; do not compare them directly to reported hydrophobic side-chain-only areas.

Return `rosalind/structure-validation.json` with the precise transformations, atom selections, measurements, comparison with `public/data/structures.json`, plugin provenance and any corrections. Do not silently substitute a predicted complex. Do not invent a conformational trajectory.

### 3. Optional targeted reference check

Investigate target `10:39` using the supplied transcript, mutation and flank. Determine whether an explicitly versioned historical RefSeq protein supports it. A verified rescue is useful; guessing an isoform is not. Return evidence and proposed mapping as a separate patch. Recompute the ESM score and eligibility only after that mapping is reviewed.

## Deliverables to bring back

1. Validation JSON files and a concise `rosalind/REVIEW.md`, including disagreements and limitations.
2. One or more screenshots of actual Rosalind tool use and results. Do not generate fake Workbench screenshots.
3. `rosalind/CONTRIBUTIONS.md`: date, exact plugin names, actual operations, inputs and hashes, output paths, and execution references where available.
4. A commit or ZIP of these files and any proposed code/data corrections. Keep account credentials and private chat history out of the public repository.

At minimum, complete the source-label audit plus one substantive independent structural check through the available Workbench capabilities. If tools cannot perform those tasks, report the limitation; the showcase's Rosalind requirement remains unfinished rather than being replaced by branding.

## Integration and submission

The original account will integrate the verified artifacts, update the evidence drawer and contribution log, rerun `npm test` and `npm run build`, and capture final application screenshots. The project must not claim Rosalind involvement before this work is complete.

Deployment to Vercel is the last step and can be done by the user. Do not post, tweet or submit the showcase entry without a separate user instruction.

## Scope stays fixed

One cancer-vaccine cohort, two exploratory computed features, within-patient shuffle reference, one separate HHAT case. No survival predictions, model training, new vaccine design, extra cohorts or clinical recommendations.
