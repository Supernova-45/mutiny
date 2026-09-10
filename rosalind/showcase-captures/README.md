# Showcase capture return — incomplete UI capture package

**Genuine Workbench UI screenshots are still awaiting the account owner.** This return contains three usable native molecular views (plus the original rejected label attempt), restored named scenes and fresh operation receipts. Native PNGs are supplemental component renders; they cannot satisfy the required proof of surrounding Workbench UI. No fake interface, compositing, arrows, captions or video were produced.

The updated handoff explicitly says: “Earlier Computer Use attempts were denied. Do not retry the same denied route or work around it.” No such retry was made. Native structure/sequence tools expose no whole-Workbench screenshot operation; the other screen-context tool is voice-only and unavailable for this text task.

## Original native images

Every PNG is 1920 × 1080. Exact UTC dates, SHA-256, plugin versions, operation IDs and per-file attribution are in [index.json](index.json). Each image has its original native render sidecar, with opaque local source URLs redacted and the pre-redaction sidecar hash retained. PNG bytes are unchanged.

| Image | Type / status | What it establishes |
|---|---|---|
| [01-hhat-native-2.png](01-hhat-native-2.png) | Native component render; inspected | Existing locally aligned 6UJQ/6UJO peptide comparison. Blue normal, orange mutant; TRP6 and PHE8 labels refer to mutant. W6 identity is shared; P8 is L/F. |
| [01b-hhat-receptor-native.png](01b-hhat-receptor-native.png) | Native component render; inspected | Peptide in the HLA groove with 302TIL binding domains. Original prepared 6UK4 source/hash is the one used by the earlier native interface render. No protein chains were moved for this shot. |
| [02-kras-contacts-native.png](02-kras-contacts-native.png) | Native component render; inspected | Mutant C6 N–HLA A70 OE1 = 3.023948 Å and C6 OD2–A114 NH2 = 2.951327 Å. Both belong to 7OW6/ASM-1; neither is a WT measurement. |
| [01-hhat-native.png](01-hhat-native.png) | Native component render; rejected for video | Original overlapping-label attempt, retained unchanged for provenance. Use the corrected `-2` file. |

Fresh operations restored these existing results: structure addition, style layers, camera framing, one native Cα re-alignment to restore KRAS (275 positions, RMSD 0.3372518644 Å), two typed measurements and an exact four-atom identity query. See [receipts/structure.json](receipts/structure.json). These are scene restoration operations, not new biological discoveries. HHAT preparation was local before this run; do not credit it to native alignment here. The prior [four-state](../plugin-results/hhat-native-four-state.png), [interface](../plugin-results/hhat-native-interface.png) and [KRAS](../contrast-kras/kras-native-contacts-2.png) native renders remain available without duplication.

## Required manual captures

Please capture the **actual open viewer and its plugin title**, with enough surrounding Workbench controls to identify the environment, and upload the original PNGs. Aim for 1920 × 1080 or larger. A context image plus a close-up is better than unreadable text. Keep the measurement panel accessible for KRAS. Do not photograph this README or a standalone PNG and label it as Workbench execution.

| Outstanding filename | Exact scene / window | Status |
|---|---|---|
| `01-workbench-hhat.png` | Molecular Structure Viewer saved scene **01 HHAT unbound W6 and P8** | Awaiting manual screenshot |
| `01b-workbench-hhat-receptor.png` | Saved scene **01b HHAT receptor context** | Awaiting manual screenshot |
| `02-workbench-kras-contacts.png` | Saved scene **02 KRAS mutant Q70 R114 contacts**; open Measurements for identities/scalars | Awaiting manual screenshot |
| `02b-workbench-kras-identities.png` | Same scene, the returned exact mutant atom identities / measurement panel | Awaiting manual companion screenshot |
| `03-workbench-sequences.png` | Biological Sequence & Alignment Viewer card for existing KRAS `peptides.afa`; both `7OW5_C` and `7OW6_C`, P6 | Awaiting manual screenshot; see limitation below |
| `04-literature-retrieval.png` | Existing Poole PMC metadata result, [original receipt](../contrast-kras/sources/poole-pmc.plugin.json) | Awaiting manual optional capture; label as reopened receipt |
| `05-workbench-density.png` | No loaded native map | Unavailable; do not stage a density image |

The structure session ID is in `index.json`; the named scenes exist in that live session. Ask the agent to restore a named scene if needed. The scene-state export `native-scenes.json` records the current scene and saved-scene **names**, not a portable project containing all saved snapshots. Native sidecar scene recipes plus exact source mappings support later restoration; opaque session handles are not guaranteed to survive a restart.

Sequence opening and switching to alignment display were acknowledged, as was moving the card to the side pane. Later display controls and the row query returned `applied:false`; the desired two-row layout was **not verified** in this run. See [sequence receipts](receipts/sequence.json) and [retry receipts](receipts/sequence-retry.json). Previous successful sequence query receipts remain in `../contrast-kras/native-sequences.json`. The source strings are VVVGAGGVGK and VVVGADGVGK; these were previously verified, not newly obtained from this failed row query. No native alignment job was run. If needed, manually expand the actual card and choose Alignment to show both records before capturing.

Manifest versions read this session: Molecular Structure Viewer 0.1.80; Biological Sequence & Alignment Viewer 0.1.43; Rosalind Workbench 0.2.5-research-preview; Life Sciences Literature 0.1.5. Only the first two were actively operated this turn. Merely reading an installed manifest is not evidence of the parent Workbench UI or a fresh literature invocation. Mol* 5.11.0 is the native renderer reported by alignment.

`build_index.py` rechecks PNG hashes/dimensions and produces the detailed index. The video account must wait for genuine UI capture and attribution review; this package is not marked complete.
