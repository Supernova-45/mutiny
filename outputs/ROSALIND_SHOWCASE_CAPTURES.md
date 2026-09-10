# Workbench screenshots for the mutiny video

**Please return genuine screenshots showing Rosalind at work. This is a priority deliverable, not an optional illustration.** The original account will make the video and concise captions. Your job is to supply the actual Workbench views and their evidence.

The scientific analyses already exist. Reopen their scenes/results; do not repeat the research or add cases just for screenshots. If a fresh operation is needed to restore a scene, retain its receipt and distinguish it from the earlier run.

## Capture these three views

| File | What should be visible | Existing evidence to use |
| --- | --- | --- |
| `01-workbench-hhat.png` | Workbench context with Molecular Structure Viewer identifiable, the HHAT peptide and its unchanged W6 beside the mutated position P8. Prefer a clear normal/mutant unbound comparison (6UJQ/6UJO) with object names and W6/P8 labels. | [Four-state native render](../rosalind/plugin-results/hhat-native-four-state.png), [render provenance](../rosalind/plugin-results/hhat-native-four-state.png.render.json), [execution record](../rosalind/PLUGIN_EXECUTION.md). Prepared comparison coordinates were reconstructed/aligned locally; do not attribute that preparation to the viewer. |
| `02-workbench-kras-contacts.png` | Molecular Structure Viewer with the normal/mutant KRAS comparison and the **mutant** Q70/R114 measurements readable: approximately **3.02 Å** and **2.95 Å**. Keep the measured object/atom identities accessible in the view or a companion screenshot. | [Verified native contact render](../rosalind/contrast-kras/kras-native-contacts-2.png), [typed measurement receipts](../rosalind/contrast-kras/native-contacts.json), [case explanation](../rosalind/contrast-kras/README.md). Use 7OW5/7OW6, both bound to engineered JDIa41b1. The older legacy distance control measured WT; do not present it as mutant. |
| `03-workbench-sequences.png` | Biological Sequence & Alignment Viewer with both KRAS peptide records legible: **VVVGAGGVGK** and **VVVGADGVGK**, preferably centered on their one changed residue, peptide position 6. Include the actual viewer identity. | [Native sequence query receipts](../rosalind/contrast-kras/native-sequences.json). These establish peptide identities, not a completed native alignment job. |

At least one image must include enough surrounding Workbench UI to establish the environment and plugin identity. If a result and its plugin identity cannot fit legibly in one frame, return a context frame plus a close-up. Use native residue labels where supported; record any unavailable label in the index rather than adding it to the screenshot afterwards.

## Two supporting captures, if available

- **Literature provenance (`04-literature-retrieval.png`):** show the actual Life Sciences Literature invocation/result identifying the primary paper (Poole, DOI `10.1038/s41467-022-32811-1`, or Devlin, DOI `10.1038/s41589-020-0610-1`). The recorded execution used the plugin's prescribed PMC/Entrez scripts, not a mounted literature viewer. A genuine tool-result view is appropriate; do not invent a viewer or imply the plugin itself extracted all assay values. Keep the capture on returned metadata rather than reproducing full article pages. Receipts: [Poole](../rosalind/contrast-kras/sources/poole-pmc.plugin.json), [Devlin](../rosalind/plugin-results/devlin-pmc.json).
- **Density review (`05-workbench-density.png`):** only after an authentic deposited map actually loads and is inspected. Show accession, map channel, contour/normalization and W6/P8. Return its operation receipt. Prior runs discovered map availability but did not load a map. The app's existing density processing is local PDBe/Gemmi work; this screenshot would document a new independent review only.

## How to return them

Save original PNG screenshots, ideally at least 1920 × 1080, under `rosalind/showcase-captures/`. Make the molecule and result large enough to read when the image is reduced for video. Dismiss unrelated panels; keep plugin/result context. Do not add captions, arrows, fake UI or composited results. Preserve original screenshots; the video account will handle crops and caption placement.

Include a short `rosalind/showcase-captures/README.md` with one entry per image:

- Filename, dimensions, SHA-256 and capture date.
- **Capture type:** whole Workbench UI, Workbench close-up, tool-result screenshot, or native component render.
- Exact plugin name/version observed in this session; receipt path and operation ID if supplied by the tool. State whether this is a reopened result or a fresh operation.
- Source accession, object/chain/residue/atom identities, state and any visible measurement definition/units.
- One factual sentence describing what this image establishes, and any relevant limitation.

Previously recorded versions were Rosalind Workbench **0.2.5-research-preview**, Molecular Structure Viewer **0.1.80**, Biological Sequence & Alignment Viewer **0.1.43**, and Life Sciences Literature **0.1.5**. Verify current versions rather than assuming they are unchanged. Mol* is the molecular renderer, not the plugin name. Do not list merely installed plugins as used.

Keep new operation receipts alongside the captures. Reference existing native PNGs and their sidecars rather than duplicating them; they remain useful clean molecular cutaways, explicitly credited as native component renders.

## If UI capture is unavailable

Earlier Computer Use attempts were denied. Do not retry the same denied route or work around it. Prepare the scenes through supported plugin tools, then ask the account owner to take the three screenshots manually and upload them. Provide the exact open scene/window and outstanding filename for each shot. Save that pending checklist in the return. Native `render_image` output can supplement the package but cannot substitute for evidence of the surrounding Workbench interface.

Report each requested shot as **captured**, **awaiting manual screenshot**, or **unavailable**, with the concrete reason. Never mark the screenshot package complete while genuine UI captures are missing. Push available files and report the commit SHA even if manual capture is still pending.

The original account will inspect the returned images, verify their claims against receipts, and integrate them with actual mutiny footage. **Do not generate the video, narration, captions or storyboard.**
