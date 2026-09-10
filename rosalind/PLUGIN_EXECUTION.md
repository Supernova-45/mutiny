# Scientific plugin execution update

Local date 2026-09-09; receipts use UTC 2026-09-10. This update supersedes the initial account-availability inference without reattributing earlier numerical calculations.

## Actual completed scientific plugin work

**Life Sciences Literature 0.1.5** was executed through its installed `ncbi-pmc-skill/scripts/ncbi_pmc.py` and `ncbi-entrez-skill/scripts/ncbi_entrez.py`, using their prescribed JSON interfaces. This is plugin-supplied Python running locally, not Python running inside a mounted Rosalind UI.

The PMC result identifies PMC8210748.1 / PMID 32807968 / DOI 10.1038/s41589-020-0610-1, author-manuscript status, `is_pmc_openaccess=false`, `license_code=TDM`, and `is_retracted=false`. Preserve those returned fields; availability for text/data mining is not a blanket redistribution license. Raw metadata and unmodified compact plugin output are retained in `plugin-results/devlin-pmc*` and `devlin-pubmed*`. Source links and retrieval timestamps come from the plugin. PubMed summary previews are truncated, so no unreturned scientific content is claimed from that preview.

Using the exact XML URL returned by the plugin, a separately identified local parser verified all seven Table 1 ligand results, including the normal/mutant SPR values, W6 Bta and alanine substitutions, and position-8 alanine. It confirmed the 10 °C/derived-kon distinction and the ITC caption/prose inconsistency. The new **HHAT-E6** claim incorporates the W6 perturbation experiments without creating new crystallographic states or imputed limits for undetected binding. Source SHA-256/MD5, table rows, checks and limitations are in `assay-source-check.json`. Full article text and figures remain outside the repository.

Reproduce with `python rosalind/analysis/run_literature_plugin.py /path/to/life-sciences-literature/0.1.5`, then regenerate evidence with the existing pipeline. The installed plugin's script handles all PMC/Entrez metadata calls. `requests==2.32.5` was installed in the isolated analysis environment; the lock now includes its dependencies.

## Viewer runtime repair and actual boundary

Installed plugins: **Molecular Structure Viewer 0.1.80** and **Biological Sequence & Alignment Viewer 0.1.43** (also shown as Sequence Viewer in the launcher). Their manifests invoke `node`; no Node executable was available on the shell PATH. After approval, the existing bundled runtime was linked at `/opt/homebrew/bin/node`. Version: v24.19.0. No plugin implementation or security control was changed.

A standard isolated MCP `initialize`, `notifications/initialized`, `tools/list` probe now succeeds for both servers. The compact startup receipts record the exact advertised tools. These probes establish server startup only: they do not provide a host-mounted viewer, session readiness, scientific analysis, native render, or screenshot. No app-only handshake, session token, resource URI, or completion event was fabricated.

The current task's host-exposed tool snapshot still lacks both viewers. A native file-pane request for reconstructed 6UK4 returned `queued`; it did not confirm a mounted viewer. Reloading the host after the runtime repair is the next step. After tools become available, use one `structure.open_from_chat` intent for the reconstructed 6UK4; add the other states to that same session, inspect the HLA-fixed comparisons, and export native render sidecars. Preserve the distinction between a rendered molecule and a screenshot documenting the surrounding workbench.

**Rosalind Workbench 0.2.5-research-preview** is installed as an app-only launcher. Earlier Computer Use denial of the Codex host is separate from the repaired Node dependency and is not bypassed. **NGS Analysis Workbench 0.2.16** tools and **Boltz 0.1.1** skills are installed, but neither was used: NGS workflows, new predictions, design, and model execution are outside this task.

## Validation

Seven source-table rows checked against plugin-resolved XML; existing 23 semantic/geometry checks pass after evidence update. Earlier local measurements and cohort exclusions remain unchanged. Pending: mounted viewer measurements, Sequence Viewer analysis and authentic Workbench screenshots. No new claim of GUI/Workbench scientific execution is made.
