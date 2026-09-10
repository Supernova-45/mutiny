# Actual contributions and capability record

**Verified plugin execution:** Molecular Structure Viewer 0.1.80 mounted all four structures, measured four W6 NE1 displacements and eight receptor contacts, and exported two native Mol* PNGs plus a results CSV. Biological Sequence & Alignment Viewer 0.1.43 mounted/query-returned four peptide records; subsequent analysis/export completion was not verified. Life Sciences Literature 0.1.5 retrieved PMC/PubMed metadata and enabled seven ligand-table checks. See `PLUGIN_EXECUTION.md` and `plugin-results/hhat-native-verification.json`. Local reconstruction, native measurements, and published assays retain separate provenance.


Date: 2026-09-09 (native receipts UTC 2026-09-10). Execution: local reconstruction and cohort/schema analysis; installed literature scripts; mounted native molecular/sequence viewer tools. Rosalind Workbench 0.2.5-research-preview is installed as an app-only launcher. NGS Analysis Workbench 0.2.16 and Boltz 0.1.1 were not used because their workflows are outside this scope.

`cua.getState()` inspected enabled app/browser surfaces; none provided Workbench. Native `web.run` public-source discovery and local `curl` retrieval accessed the Devlin paper and pVACtools documentation/source. `view_image` inspected authentic published Figure 1 and Figure 2 labels; these are paper figures, not screenshots of Workbench activity. Tool versions for built-in web/UI are not reported by the session. No GPT-Rosalind model access is claimed.

## Execution and outputs

- `analysis/structure.py`: new independent raw-PDB parser/sequence checks, deposited symmetry enumeration, receptor reconstruction, HLA fits and sensitivity, per-residue backbone/shared-sidechain comparisons, W6 ring geometry/torsions, contacts/endpoints and whole-residue SASA. Exports `mechanism.json` and separate `structures/` coordinates.
- `analysis/evidence.py`: source-linked curated assay extraction from paper text and printed figure labels. Exports `evidence.json`; `refine_contract.py` attaches new computed measurements and strengthens measurement schemas.
- `analysis/response-capture.mjs`: existing statistics functions on unchanged eligible cohort, all patients/orders/k, with independent small-case verification. Exports `response-capture.json`.
- `analysis/contracts.py`: proposed schemas; Rojas source-label cross-check and normalization; independent HCC1395 adapter; separate HHAT project; matched request/return with unresolved mapping and separate proposed correction.
- `analysis/validate.py`: 23 contract/geometry checks recorded in `validation.json`. Existing `node --test tests/*.test.mjs`: six tests pass. Source XLSX audit is in `cohort-validation.json`.
- `requirements.lock.txt`: actual installed Python dependencies. Python 3.9 environment in this run, with NumPy 1.26.4 and Biopython 1.85; no ML packages or weights required. Node is the bundled runtime; exact version in `environment.json`.
- `manifest.json`: artifact file hashes. Raw PDB hashes are in the mechanism; table hashes in projects and cohort audit. `source-retrieval.json` records public article/figure downloads and pinned fixture source/license hashes. Full copyrighted article/figures are not redistributed.

Reproduce from repository root: create a Python virtual environment, install `rosalind/requirements.lock.txt`, place Node on PATH, then run `bash rosalind/analysis/run.sh`. No source download is needed for geometry, normalized fixtures or response capture; original raw files are present. Evidence extraction is an inspectable curated transcription, not automatic parsing of plot curves. Claims link directly to sources for review.

## Unsupported

Whole-Workbench screenshots remain unavailable; native molecular renders and scientific-plugin execution succeeded. `screenshots/UNSUPPORTED.md` makes the missing deliverable explicit. No imitation screenshots were created. RTK.md referenced by the supplied AGENTS instruction was absent from the repository and searched Codex/Documents locations; no RTK-specific workflow could be read. No source/model/reference changes, deployment, frontend, narration or video were performed.
