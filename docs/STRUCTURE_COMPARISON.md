# Structural comparisons

Mutiny opens with the published HHAT normal/mutant example. Choose a binding prediction, inspect mutation → neighboring W6 → receptor contact, and reveal the published SPR measurements. **Save investigation** preserves your prediction, notes, controls, camera and source versions. **Save figure** captures the displayed structures with source and measurement captions. These are static crystal comparisons, not molecular trajectories or vaccine-response predictions.

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

The uploaded-pair fit differs from the curated HHAT example's HLA-platform (residues 1–180) fit and fixed nine-atom W6 indole-ring comparison. Do not equate the two metrics. For raw 6UJQ/6UJO, the local whole-chain fit uses 275 Cα atoms, with RMSD 1.027003 Å. An independent NumPy Kabsch calculation agrees within 0.000001 Å. This numerical check does not independently establish biological suitability for other uploaded pairs; that review is requested in the Rosalind handoff.

## Saved investigations

The version-1 JSON formats are deliberately distinct:

| Kind | Contents | Reopening |
| --- | --- | --- |
| `mutiny-hhat-investigation` | Prediction, reveal state, note, mechanism, residue, experiment selection, camera; structure and evidence hashes | Open investigation in the HHAT example; requires the same bundled source versions |
| `mutiny-structure-pair` | Original PDB text, filenames, SHA-256 hashes, chain roles, declared source types/receptor states, note, view and alignment summary | Open investigation in Compare your pair; revalidates hashes and recomputes geometry from inputs |

Notes are capped at 2,000 characters. Files with invalid metadata, hashes, views or comparisons do not replace the current investigation. SHA-256 detects a changed input relative to the saved hash; it does not authenticate the source. No server, database or account is involved. Save before leaving or reloading the app. Share these files only when you intend to share their original coordinates and notes.

PNG exports preserve the currently displayed orientation; zoom and select a residue before exporting. Exported notes are shortened to 240 characters. Predicted/uploaded geometry never receives the curated HHAT assays.

[Source biology](SCIENCE.md) · [Focused Rosalind review request](../outputs/ROSALIND_STRUCTURAL_COMPARISON.md)
