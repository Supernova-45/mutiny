# Development and reproduction

Run the app with Node.js 22: `npm ci` then `npm run dev`. Validate with `npm test` and `npm run build`.

`npm run prepare:rosalind` regenerates the small browser evidence projection and research fixture from committed scientific outputs. It checks ligand identity/order, source hashes, four fixed-HLA ring comparisons and two contact distances against the existing display coordinates. It does not modify `rosalind/` or rerun its scientific pipeline. Run it again after accepting a changed scientific return, then inspect the resulting diff and run the tests.

The new local project-review flow and HHAT experiment controls have a focused check: `npm run test:research-browser` (same `CHROME_EXECUTABLE` option as below). It verifies save/reopen, invalid-import retention, no import network requests, measured/absent ligand values, static reference poses and narrow-screen layouts. These checks do not record a video.

The structural comparison has a separate browser check: `npm run test:comparison-browser`. It covers prediction/reveal, local PDB comparison, linked cameras, per-residue measurements, source declarations, both investigation round trips, invalid-import retention, no import requests, PNG exports and mobile layouts. Set `APP_URL` when Vite is running on a different port. The numerical tests include a known rigid transform, chirality preservation, incompatible-input rejection and an independent NumPy baseline for the whole-HLA fit. See [comparison scope](STRUCTURE_COMPARISON.md).

## Scientific reproducibility

See [methods](SCIENCE.md), [source manifest](../data/derived/source-manifest.json), and [model lock](../data/derived/model-lock.json).

```sh
python3.12 -m venv .venv
.venv/bin/pip install -r requirements-analysis.txt
.venv/bin/python scripts/fetch_sources.py
.venv/bin/python scripts/audit_rojas.py data/raw/rojas-2023-table5.xlsx
.venv/bin/python scripts/map_proteins.py
.venv/bin/python scripts/score_esm.py
MHCFLURRY_DATA_DIR="$PWD/work/model-cache/mhcflurry" TF_USE_LEGACY_KERAS=1 .venv/bin/mhcflurry-downloads fetch models_class1_pan
.venv/bin/python scripts/score_binding.py
.venv/bin/python scripts/combine_scores.py
.venv/bin/python scripts/prepare_data.py
.venv/bin/python scripts/prepare_structures.py
.venv/bin/python scripts/check_crystal_mates.py
npm test
```

ESM weights download on first use. Apple MPS is used where available; otherwise CPU. The completed run used MPS. Reference GenBank files are already cached in the repository. Do not silently replace them with newer versions. ESM resumes existing target scores; remove its derived score file only when intentionally recomputing the same locked method. If changing the method or checkpoint, use a separate result file and update provenance.

## Browser verification

With the app running, run `npx playwright install chromium` and `npm run test:browser`. For an already installed Chrome, set `CHROME_EXECUTABLE` to its executable path. Set `RECORD_DEMO=1` to capture a walkthrough (requires Playwright's FFmpeg installation). Screenshots and the real recording are written to `outputs/`. The browser checks cover desktop/mobile layouts, all orders, outcome preservation, evidence, PDB state changes, geometric contact labels and synchronized rotation.


## Sources and licensing

- Rojas et al. (2023), [Nature](https://doi.org/10.1038/s41586-023-06063-y), Supplementary Table 5. Study data are attributed under the article's CC BY 4.0 terms.
- Devlin et al. (2020), [Nature Chemical Biology](https://doi.org/10.1038/s41589-020-0610-1). Experimental coordinates: [6UJQ](https://www.rcsb.org/structure/6UJQ), [6UJO](https://www.rcsb.org/structure/6UJO), [6UK2](https://www.rcsb.org/structure/6UK2), [6UK4](https://www.rcsb.org/structure/6UK4), via RCSB PDB. Renderings are generated from coordinates, not copied article figures.
- RefSeq transcript/CDS records via NCBI; returned versions and checksums are retained.
- ESM-2 [checkpoint](https://huggingface.co/facebook/esm2_t33_650M_UR50D) and [MHCflurry](https://github.com/openvax/mhcflurry).

Original mutiny code is MIT licensed. Third-party data, model weights and dependencies retain their own terms. Model weights are not redistributed in this repository.

## Rendering and README loop

`src/lib/molecular-style.ts` defines the shared stage palette and view style. Ambient occlusion is limited to fine-pointer devices; reduced-motion preference disables camera/opacity/chart transitions. Both original and imported comparisons use the same lighting. Format source with `npm exec --yes --package=prettier@3.6.2 -- prettier --write 'src/**/*.{ts,tsx,mjs,mts,css}'`.

The short README loop uses real browser captures: `node scripts/capture_hero.mjs`, then `python scripts/make_hero.py` with Pillow 12.3.0. Set `APP_URL` and `CHROME_EXECUTABLE` as in the browser checks. Frames stay in ignored `work/hero-frames/`; the final GIF and scientific source-hash manifest are committed. The GIF moves the camera around three discrete experimental views. It is not a molecular trajectory or a recording of a Rosalind UI.

`npm run test:rendering-browser` checks that camera transitions remain visible, reduced-motion settings are honored, rapidly changed selections settle on the correct experimental structures, and the new stages fit mobile.
