# Rosalind handoff: one focused structural-comparison tool

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

Required package: cancer context; exact gene/variant and peptide/HLA identities; normal and mutant coordinates; receptor-bound states; primary paper and precise assay locations; measured versus predicted evidence; data/asset redistribution terms; one concise visitor question and an answer the experiments actually support. Include a predeclared choice/reveal mapping without overstating vaccine efficacy. A gene match alone is insufficient.

Do not add a cancer-type selector until another complete case is ready. Do not imply visitors are receiving personalized medical predictions. The current personalization is their hypothesis, annotations and saved molecular scene.

## Deferred

General HCC1395 evidence enrichment, dashboard expansion, CSV/ZIP project adapters, automatic vaccine selection, arbitrary TCR docking, new model training and RNA cassette design. The existing candidate reviewer remains available as a secondary tool. Retain previous schema findings for later; they need not delay this narrower comparison release.

No video, narration, captions, storyboard or player work. Those remain with the original account after the completed app is ready.

Work in `rosalind/` and return the commit SHA when eventually executed. Leave frontend code and generated `public/` projections to the original account. Do not relabel local work as plugin execution, and do not bypass denied capabilities.
