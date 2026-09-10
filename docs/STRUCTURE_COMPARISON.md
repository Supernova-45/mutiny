# Structural comparisons

Mutiny opens with the published HHAT normal/mutant example. Choose a binding prediction, inspect mutation → neighboring W6 → receptor contact, and reveal the published SPR measurements. **Save investigation** preserves your prediction, controls, camera and source versions. **Save figure** captures the displayed structures with source and measurement captions. The opening view focuses on W6, with dashed connectors between matching ring atoms and a shared 0–4 Å RMSD scale. The connectors are geometric differences, not chemical bonds or a simulated path. These are static crystal comparisons, not molecular trajectories or vaccine-response predictions.

## KRAS G12D

Choose **KRAS G12D** for the second curated case: normal 7OW5 and mutant 7OW6, both bound to the same engineered JDIa41b1 receptor, HLA-A*11:01. Inspect the mutation, its HLA contacts, or the receptor; gray lines on the mutant panel show the aligned normal peptide. Both cameras fit a shared coordinate frame. Per-residue bars use common backbone N/CA/C/O atoms on a shared 0–1 Å scale. Side-chain RMSDs are deliberately omitted here because symmetric atom naming can create apparent movement.

The app applies the independently reviewed `curated-kras-shared-hla-v1` rule to these two source hashes only: 275 shared HLA A Cα atoms at author positions 2–276, whole-HLA RMSD 0.337252 Å. Mutant A:1 is retained in the displayed deposit but excluded from fitting because it is absent in normal. Original files remain under `rosalind/contrast-kras/sources/`; the derived public coordinates preserve author chain and residue identities and transform the entire complex together. The generic importer still rejects this pair's different observed HLA sequences.

The reveal comes from Poole et al., 2022, Table 2: normal KD 3,000 nM (uncertainty not printed), mutant 0.743 ± 0.018 nM (SD, n=2). These are receptor–pHLA affinities. The parent JDI receptor and third-generation construct are different reagents; their measurements are not substituted. HLA Q70/R114 dashed lines show nearest heavy atoms, with exact pairs in the evidence details. In particular the normal R114 pair uses peptide N, while mutant uses OD2; these distances are not identical-atom displacements or interaction energies. Free mutant peptide central residues are missing, so the app provides only the complete bound pair.

Experimental density remains unavailable. The native validation reports are support for source quality, not maps or side-chain certainty. See [the complete scientific return](../rosalind/STRUCTURAL_RETURN.md).

## Compare your pair

Choose **Compare your pair**, open a normal and a mutant PDB, and assign each HLA heavy chain and peptide chain. Mark the coordinate source and receptor state when known. Those declarations are supplied by you, not independently verified by the app. Nothing is uploaded.

This release accepts:

- PDB coordinates, first model only; up to 3 MB and 30,000 heavy ATOM records per file.
- Standard amino acids in the assigned chains. Blank/A alternate locations, with blank preferred. Hydrogen/deuterium, HETATM and later models are excluded.
- Identical observed HLA sequences, at least 150 observed residues and 100 matching Cα atoms. Different author chain names, numbering and insertion codes are allowed; correspondence follows observed sequence order.
- Equal-length 8–14-residue peptides with exactly one substitution. Both peptide ends need Cα atoms.

Missing HLA residues that break observed sequence identity, modified residues in selected chains, multiple substitutions, class-II peptides and mmCIF input are outside this release. Uploading a structure does not establish that the variant is cancer-derived. Compare biologically matched complexes: different receptor states, crystal environments or prediction methods can also produce differences.

## What the measurements mean

The mutant is rigidly aligned to the normal structure using all matched Cα atoms of the assigned HLA heavy chain, with a proper Horn quaternion rotation. The peptide is never independently fitted. The display applies one further shared orientation; this does not change distances. It includes the assigned HLA and peptide, with normalized display chains A/C and residue positions. Original author identities and original files remain in the investigation.

Each residue has a backbone RMSD over common N/CA/C/O atoms, and a side-chain RMSD over common named heavy atoms, excluding N/CA/C/O/OXT. The mutated position has no side-chain RMSD because the amino acids differ. Missing values are not zero. Atom correspondence and missing atoms affect these measurements; chemically symmetric atoms are not remapped. Per-residue measurements, atom lists and source residue identities are included in saved investigations. Reopening always recomputes them from the inputs.

The uploaded-pair fit differs from the curated HHAT example's HLA-platform (residues 1–180) fit and fixed nine-atom W6 indole-ring comparison. Do not equate the two metrics. For raw 6UJQ/6UJO, the local whole-chain fit uses 275 Cα atoms, with RMSD 1.027003 Å. An independent NumPy Kabsch calculation agrees within 0.000001 Å. This numerical check does not independently establish biological suitability for other uploaded pairs; the independent Rosalind return now verifies the pinned engine on 12 controlled fixtures, with its limitations documented in `rosalind/comparison-review/README.md`.

## Saved investigations

The version-1 JSON formats are deliberately distinct:

| Kind | Contents | Reopening |
| --- | --- | --- |
| `mutiny-hhat-investigation` | Prediction, reveal state, note, mechanism, residue, experiment selection, camera; structure and evidence hashes | Open investigation in the HHAT example; requires the same bundled source versions |
| `mutiny-kras-investigation` | Prediction, reveal, scene, selected residue, overlay and camera; SHA-256 of the full bundled KRAS evidence manifest | Open investigation in KRAS; rejects different source evidence before replacing current state |
| `mutiny-structure-pair` | Original PDB text, filenames, SHA-256 hashes, chain roles, declared source types/receptor states, note, view and alignment summary | Open investigation in Compare your pair; revalidates hashes and recomputes geometry from inputs |

The finding editor has been removed. Notes in previously saved files are retained for compatibility and remain capped at 2,000 characters. Files with invalid metadata, hashes, views or comparisons do not replace the current investigation. SHA-256 detects a changed input relative to the saved hash; it does not authenticate the source. No server, database or account is involved. Save before leaving or reloading the app. Share these files only when you intend to share their original coordinates and notes.

PNG exports preserve the currently displayed orientation; zoom and select a residue before exporting. Exported notes are shortened to 240 characters. Predicted/uploaded geometry never receives the curated HHAT assays.

[Source biology](SCIENCE.md) · [Focused Rosalind review request](../outputs/ROSALIND_STRUCTURAL_COMPARISON.md)
