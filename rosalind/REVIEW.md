# Scientific evidence review — 2026-09-09

**Verified plugin execution:** Molecular Structure Viewer 0.1.80 mounted all four structures, measured four W6 NE1 displacements and eight receptor contacts, and exported two native Mol* PNGs plus a results CSV. Biological Sequence & Alignment Viewer 0.1.43 mounted/query-returned four peptide records; subsequent analysis/export completion was not verified. Life Sciences Literature 0.1.5 retrieved PMC/PubMed metadata and enabled seven ligand-table checks. See `PLUGIN_EXECUTION.md` and `plugin-results/hhat-native-verification.json`. Local reconstruction, native measurements, and published assays retain separate provenance.


Initial reconstruction and full-precision structural calculations were completed locally. Native Molecular Structure Viewer measurements and renders subsequently verified selected geometry. This does not imply GPT-Rosalind model execution or a screenshot of the launcher UI.

## Supported conclusions and integration claims

- **HHAT-G1:** The L75F substitution is peptide position 8. With HLA A Cα 1–180 fitted to 6UJQ, W6 indole matching-atom RMSD is 3.291 Å between the receptor-free normal/mutant structures, 2.987 Å between normal free/bound, 1.021 Å between mutant free/bound, and 0.161 Å between the two bound structures. These are new calculations from raw coordinates. HLA-only 5–175 sensitivity changes each by <0.007 Å. Mutant free/bound geometry is closer, but is not identical: W6 χ2 is 78.85° free and 30.83° bound. Do not present a zero-change mutant cartoon.
- **HHAT-G2:** Independently enumerating all deposited SMTRY operators and lattice translations −1..1 yields exactly one receptor mate with peptide contacts ≤4 Å for each bound state: 6UK2 (+a,−b,0), 6UK4 (0,+b,0), identity rotation. W6 NE1→Tyr100α ring centroid distances are 3.3116 and 3.3055 Å. Minimum heavy-atom distances are instead 3.1342 and 3.2784 Å. Explicit endpoint coordinates and separate ring-to-ring metrics are exported.
- **HHAT-E1:** Equilibrium SPR at 25 °C: mutant KD 9 ± 1 µM; normal 200 ± 30 µM (SD, nine independent experiments each). This is receptor–pMHC binding.
- **HHAT-E2:** NanoDSF/backscatter thermal melting: mutant 56.1 ± 0.2 °C, normal 54.7 ± 0.4 °C (SD, six independent measurements). Similar thermal stability supports the authors' contrast with receptor recognition; this is **not a directly measured peptide–HLA affinity**.
- **HHAT-E3/E4/E5:** Evidence preserves 10 °C kinetics, derived association rates, functional IL-2 EC50 with the censored normal value, and ITC as distinct assays. Conditions, printed figure/table locations, units and uncertainty are in `evidence.json`.
- **HHAT-I1:** The authors interpret structural and kinetic evidence as pre-organization. Four static structures alone cannot establish dynamic populations, transition rates or binding energies. The ovarian HHAT case is independent of the Rojas pancreatic vaccine cohort.

A supported headline is: **“The mutation changes a neighboring peptide surface; 302TIL recognizes the mutant more tightly.”** Pair this with assay-specific labels rather than a claim that structure predicts vaccine response.

## Accessibility and frame

Whole-residue W6 pMHC-only SASA (Å²) is 147.43, 137.36, 156.20 and 133.54 for 6UJQ, 6UJO, 6UK2 and 6UK4. Bound-complex W6 SASA is 13.41 and 8.85 Å². Position 8 values and unique contacts are also exported. pMHC-only for a bound state means removing receptor chains from that same crystallographic conformation, not relaxing it. Sampling uses Biopython 1.85 Shrake–Rupley, 1.4 Å probe, 200 points/atom, protein heavy atoms in the reconstructed deposited orientation. Whole-residue areas agree with existing rounded values and must not be compared directly with the paper's hydrophobic-sidechain-only areas.

New coordinate files use the raw 6UJQ HLA frame, without the app's display rotation. The existing display files are untouched. Apply the supplied frame consistently to both atoms and distance endpoints when integrating. Full JSON precision is computational precision, not crystallographic certainty; deposited resolutions span 2.25–3.14 Å. Matching atom names, blank/A alternate locations, residue numbering, transformations, fit residuals and exact selections are recorded.

## Discrepancies and proposed corrections

The paper's prose says ITC KD was higher than SPR, but Extended Data Figure 2 gives 1.7 and 1.4 µM, lower than the SPR 9 µM. Preserve the numerical caption and flag the inconsistency; do not silently “correct” the paper or combine assays. Figure 2a states normal EC50 ≥200 µM and mutant 1.1 ±0.1 µM; use these rather than reversing the prose's ambiguous EC50 comparison.

No correction to existing source coordinates, scores, outcomes or eligibility is proposed. A separate request/return fixture proposes a **display label** clarifying mutant source context, with automatic application disabled. Target 10:39 remains unresolved and excluded; no reference rescue or rescoring was performed.

## Retrospective dataset

`response-capture.json` contains all 16 patients, published/ESM/binding/shuffle orders, k=1..N, exact target/response IDs, and pointwise central 90% references from 2,000 seeded within-patient shuffles. Counts remain 232 total; 23 individual positives, 200 non-detected, seven unresolved pool members, two missing; 188 comparable, with 22 positive and 166 non-detected. Both predicted HLA annotation classes exist on every source row and do not identify responding restriction. Zero-positive patients remain present and marked noninformative. This measures retrospective capture among already administered targets, not prospective selection, benefit, or model superiority.

## Verification and remaining work

Run `analysis/run.sh` in the pinned environment. `validation.json` records 23 checks; response generation additionally checks a six-permutation exact small case. The repository's six existing scientific tests pass. No frontend was changed or browser implementation certified. Whole-Workbench screenshots, researcher usability testing, and frontend import/export/network behavior remain uncompleted, with explicit reasons. Native molecular measurement and rendering succeeded. No video, narration, captions, storyboard, player, training or simulated trajectory was generated.

**HHAT-E6:** Separate 25 °C SPR perturbation experiments report W6 Bta-analogue KD values of 170 ±30 µM on the F8 background and 1600 ±500 µM on the L8 background (SD, n=3). W6 alanine variants had no binding detected, with no numeric limit supplied. These support W6 involvement; they are additional experimental ligands, not four new structures or an isolated bond-energy measurement.
