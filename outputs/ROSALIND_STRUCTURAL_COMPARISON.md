# Rosalind handoff: independent review of the new 3D evidence view

**Updated 2026-09-10.** The earlier independent comparison review and curated KRAS return are complete and integrated. Do not repeat them or find another cancer case. Keep the accepted scientific receipts in `rosalind/`.

**Return received at `cdbf614`:** native molecular renders and restored scenes are ready; [genuine Workbench UI captures](../rosalind/showcase-captures/README.md) still require the account owner. The [density review](../rosalind/density-review/README.md) checked distributed crops numerically but could not load original maps natively. Do not repeat the same blocked calls. Complete the outstanding manual captures first; further native map review needs a supported change in capability.

The app now adds **Superimpose in 3D** to HHAT and KRAS: normal/mutant switching in one HLA-aligned scene, a residue selector, source-captioned figure export, and shareable curated views. HHAT also has locally processed PDBe 2Fo-Fc density for all four experimental states. The original account handles the app, public-data analysis, rendering, deployment and the later video.

## First: capture the actual Workbench contribution

**Screenshots are a required deliverable for the showcase video.** Follow [the capture brief](ROSALIND_SHOWCASE_CAPTURES.md): reopen the verified molecular and sequence scenes, capture genuine Workbench context, and link each image to its operation receipts. Existing native renders are useful but do not show the surrounding Workbench interface. Capture this package before spending time on the density loading issue.

## Then: independent density review

**Independently check one unbound HHAT map pair around W6/P8.** Start with 6UJQ and 6UJO. Read [the processing method](../docs/EXPERIMENTAL_DENSITY.md) and [the exact manifest](../public/density/manifest.json), plus `scripts/prepare_density.py`.

Use live Molecular Structure Viewer capabilities if they can load an authentic deposited map. The previous workspace-read-root failure was a Workbench limitation, not a global public-data access restriction. Do not work around denied capabilities. If native map loading remains unavailable, report it once; the application no longer depends on that operation.

Check and return:

- Correct deposited structure and map channel; original-coordinate W6/P8 appearance at a stated threshold and normalization convention.
- Agreement with the app's display-frame crop, including CCP4 axis order, non-orthogonal cell handling, proper rigid transform and inverse sampling. The app uses full-unit-cell mean/SD before cropping, 0.35 Å resampling and a 2 Å display mask around the selected peptide residue.
- Whether the chosen 1.0 σ default is useful and whether the available 0.7–1.6 σ range risks a misleading impression. Keep visual judgment separate from numeric coordinate checks and whole-residue RSCC/RSRZ.
- Any concrete scientific issue in the HHAT/KRAS superposition labels. Context is from the normal structure in Superimpose mode and from the selected structure in Normal/Mutant modes; atom coordinates are never interpolated. Both KRAS structures contain the engineered JDIa41b1 receptor.

Return a short `rosalind/density-review/README.md`, exact source URLs and hashes, operation receipts, and native images if supported. Clearly separate native plugin output from local calculations. Review the existing assets; do not replace them or claim this account's Gemmi processing was performed by Rosalind.

## Keep the scope tight

No new datasets, new cases, model training, candidate dashboards, receptor docking, automatic vaccine selection or generic importer changes. The question stays: **how can a cancer mutation change what a T-cell receptor recognizes, even beyond the mutated position?** The app supports structural investigation, not a vaccine-response prediction.

Do not generate video, narration, captions or a storyboard. That remains with the original account after review. Work only in `rosalind/density-review/` and `rosalind/showcase-captures/`, preserve earlier outputs, push the return and report the commit SHA. Frontend and `public/` assets remain owned by the original account.
