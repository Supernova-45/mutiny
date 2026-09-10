# mutiny media plan

Owner: this account. Rosalind supplies scientific evidence, never video, captions, narration or player implementation.

## Required Workbench evidence before the final video

The user explicitly wants the film to show how Rosalind was used. The [capture brief](ROSALIND_SHOWCASE_CAPTURES.md) requests three genuine Workbench views: HHAT structural comparison, verified KRAS contact measurements, and peptide sequence inspection. Literature retrieval and a successful new density review are supporting captures when available. Existing native molecular PNGs are component renders, not screenshots of Workbench.

App footage can be prepared now. Do not finalize the showcase film until the genuine Workbench captures have been received, visually inspected, and matched to their operation receipts. If capture permissions remain unavailable, obtain manual screenshots from the account owner; do not create a substitute UI.

Make Rosalind part of the explanation: show the unchanged W6 in mutiny, briefly show the real Workbench scene used to inspect the structures, then return to the interactive comparison and measured binding result. Use the sequence/contact captures only where they explain the corresponding case; do not cut from KRAS evidence into an HHAT claim. A compact on-screen credit can name each plugin at the moment its actual contribution appears.

Keep attribution exact: Molecular Structure Viewer inspected/measured structures; Biological Sequence & Alignment Viewer queried peptide identities; Life Sciences Literature retrieved primary-source metadata through plugin scripts. Local code prepared structures, extracted assay tables, calculated the app's metrics and processed PDBe density with Gemmi. Only credit independent native density inspection if a successful new receipt and capture return. None of these operations predicts vaccine benefit.

## Short loop first

The README loop shows three discrete HHAT views: mutation, neighboring W6, receptor contact. It captures the actual browser viewer with a small synchronized camera rotation. The atom coordinates are never interpolated. Brief caption bands identify each feature; the final view includes the source-backed normal/mutant SPR values. The scientific source hashes are recorded in `outputs/hero-loop.provenance.json`.

Reproduce with `node scripts/capture_hero.mjs` against a running app (`APP_URL` and optional `CHROME_EXECUTABLE`), then `python scripts/make_hero.py` with Pillow installed. The output is `outputs/screenshots/mutiny-hero.gif`: 720 pixels wide, 27 frames, 10.74 seconds. The encoder records its dimensions, duration, byte size and SHA-256 alongside the source hashes. The recording uses the app’s own camera fits, with no extra zoom for the video. Static alternatives remain in `outputs/screenshots/16-hhat-export.png` and the README links to them.

## Later, after the scientific return

A longer narrated/captioned film is optional. If made, start with the visual question, show a short interaction, reveal the corresponding experiment, and finish on the reusable local comparison. Captions should be concise and engaging. Keep HHAT independent of the pancreatic vaccine cohort and any future engineered-TCR case. Do not imply clinical predictions, atom trajectories, or completed Rosalind operations that lack receipts.

Deployment and the public README link belong to this account's packaging work. Use a verified public production URL, not a protected deployment-preview URL.


## New visual material, 2026-09-10

The focused 3D view is ready for the later recording: normal/mutant superposition, exact-structure switching, experimental HHAT density, and a shareable view. Lead with HHAT W6 rather than a tour of controls. One possible short sequence is superposition → normal/mutant switch → density on → return to the measured binding experiment → share the observation. Capture the real browser interaction, not invented atom motion. Keep KRAS as an optional contrasting beat if the film remains clear and concise.

The viewer now fills the viewport and has **Molecular context / Residue detail** plus an optional camera orbit. Use a short wide receptor view to establish scale, then select W6 to move into the contact. HLA is gray, receptor purple, normal peptide blue and mutant orange. Only the HLA peptide-binding platform and, in the receptor step, receptor binding domains are shown; this is not a whole-cell or complete membrane-bound assembly. Context uses the selected structure, or the normal reference when superimposed. Orbit is opt-in, stops on manual interaction, and is not replayed from a shared link. Reduced-motion preference makes camera transitions immediate. Preserve real coordinates throughout.

Density was prepared directly from public PDBe data with Gemmi by the original account; it is not a new Rosalind operation. If independent Workbench review returns later, credit only the operations actually recorded. Do not wait for that review to gather app screenshots; do review any scientific corrections before recording the final film.
