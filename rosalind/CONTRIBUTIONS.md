# Actual contributions and capability record

**Capability correction:** Rosalind Workbench 0.2.5-research-preview is installed (build revision f3a14882a0b8). Its launcher is app-only. The user confirmed using it. Model-callable scientific tools remain absent in this task; attempted UI access to com.openai.codex was explicitly denied by Computer Use. This does not establish account-wide unavailability. The installed catalog names Life Sciences Literature, Molecular Structure Viewer and Sequence Viewer, but their connected status is unverified. No scientific execution attribution changes.

Date: 2026-09-09. Execution: local Codex desktop shell, Python and Node; **no Rosalind Workbench work performed**.

The complete callable-tool metadata was searched for Rosalind, scientific capabilities and tool/plugin discovery. Exact plugin names named by exposed connector metadata were **Spreadsheets**, **Plugin Management**, and **Sites**; UI control was exposed through **unified-computer-use**. These are not scientific plugins. No `search_plugins`, `suggest_plugins`, `tool_search`, Rosalind, molecular viewer, alignment or scientific evidence connector was callable. The recommended but uninstalled plugin list is not evidence of a connection. The Plugin Management skill was read; its search tools were not exposed, so account-wide catalog availability could not be certified. No plugins were installed or permission settings changed.

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

Authentic Workbench screenshots and native scientific-plugin execution are unavailable. `screenshots/UNSUPPORTED.md` makes the missing deliverable explicit. No imitation screenshots were created. RTK.md referenced by the supplied AGENTS instruction was absent from the repository and searched Codex/Documents locations; no RTK-specific workflow could be read. No source/model/reference changes, deployment, frontend, narration or video were performed.
