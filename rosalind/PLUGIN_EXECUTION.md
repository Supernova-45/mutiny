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

After the host refreshed its tools, both native viewers became callable. One Molecular Structure Viewer session opened prepared 6UK4 and added prepared 6UJQ, 6UJO and 6UK2. Live state verified all four object transforms were identity: reconstruction and HLA fitting happened in the independently executable local pipeline, not inside the viewer. Native measurements therefore use the exported PDB's 0.001 Å precision in the common HLA frame.

## Native measurements and artifacts

`plugin-results/hhat-native-measurements.json` preserves exact model-visible structured results published by Codex. The native `structure.export` CSV and its sidecar are separate, unmodified native exports. `hhat-native-atom-identities.json` maps tool atom IDs to author residue/atom identifiers; opaque model IDs were omitted from this public copy. The contact result strings contain internal residue indices C:380 and D:481; these must not replace author numbering C6 and D100.

The W6 NE1 single-atom displacement in Å is 5.259177 for normal free→bound, 0.976100 for mutant free→bound, 5.693492 for normal→mutant free, and 0.120023 for normal→mutant bound. These are geometric differences between crystals, not a molecular path or rate. Native 6UK4 W6-to-TCR-alpha analysis returned all eight atom pairs within 4 Å, all involving Tyr100α, minimum 3.278193 Å (NE1–CZ). The endpoint is distinct from the NE1-to-ring-centroid distance in the full-precision local analysis.

Two semantic controls are retained to prevent misuse. Native `rmsd` performs Horn least-squares fitting of the selected ring: 0.004011 Å for the nine WT free/bound indole atoms reflects ring shape after refitting, **not** the 2.986529 Å HLA-fixed matching-atom RMSD. Native distance between two multi-atom selections returned the closest pair (0.753936 Å), **not** centroid separation. Neither control drives a displacement claim. An initial contacts analysis was invalidated when objects were added; the CSV retains its invalidation marker, and only the later complete eight-row analysis is used.

`analysis/verify_native.py` checks all four native atom distances and all eight contacts against the prepared PDB files with 0.00002 Å arithmetic tolerance, verifies contact-set completeness, and validates native PNG hashes. This tolerance handles float32 arithmetic, not experimental uncertainty. It links the verified receipts and images into mechanism/evidence provenance. Re-running this script verifies retained receipts; it does not claim a fresh live plugin run.

Native `structure.render_image` generated `hhat-native-interface.png` and `hhat-native-four-state.png`, each 1400×1000, with Mol* 5.11.0 replay/provenance sidecars. Both were visually inspected. The interface view shows peptide C and Tyr100α sticks with HLA A and TCRα D cartoons; its green selection highlight is native UI state. The comparison shows all four peptide C chains against 6UJQ HLA A: normal free blue #4575B4, mutant free red #D73027, normal bound light blue #74ADD1, mutant bound orange #FDAE61. Other chains are omitted in these focused views. Native images preserve current viewer appearance; they are molecular renders, not screenshots of the surrounding Workbench. Public sidecars redact only opaque local viewer-file capability URIs and retain a hash of the original sidecar; PNG bytes are unchanged.

Biological Sequence & Alignment Viewer mounted `plugin-results/hhat-peptides.afa` and returned all four 9-residue records. The local source-safe adapter derives their chain C sequences from the deposited PDBs and records source hashes and the +67 coordinate mapping (L75F is peptide position 8; W6 is HHAT73). The alignment action acknowledged a queued exploratory job, but subsequent job/query/export requests returned “The viewer could not apply the requested action.” No completed native alignment, distance matrix or export is claimed. The source file remains available to reopen.

**Rosalind Workbench 0.2.5-research-preview** is installed as an app-only launcher. Earlier Computer Use denial of the Codex host is separate from the repaired Node dependency and is not bypassed. **NGS Analysis Workbench 0.2.16** tools and **Boltz 0.1.1** skills are installed, but neither was used: NGS workflows, new predictions, design, and model execution are outside this task.

## Validation and remaining limits

Seven published ligand-table rows, four native fixed-frame distances, eight native contacts, two native image hashes, and the 23 existing semantic/geometry checks pass. The 188-target cohort comparison, exclusions, independent unlabeled fixture, and assay separation are unchanged. Whole-Workbench UI screenshots remain unsupported because Computer Use access to the Codex host was denied; native rendering did not bypass that denial. Full-complex native SASA was not attempted because the advertised 2,000-atom budget is below the required occluder context; the separately attributed whole-complex local SASA remains available. No frontend, video, model training, new prediction, or simulated trajectory was created.
