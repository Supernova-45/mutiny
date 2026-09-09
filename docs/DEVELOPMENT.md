# Development and reproduction

Run the app with Node.js 22: `npm ci` then `npm run dev`. Validate with `npm test` and `npm run build`.

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
