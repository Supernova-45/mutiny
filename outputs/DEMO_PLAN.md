# mutiny — interactive demo and captioned film

Owner: the original Codex agent in the originating account, after the Rosalind-enabled agent updates GitHub and the user returns. The Rosalind handoff does not assign video, narration, caption, storyboard or video-player production.

Status: proposed next build. These interactions and the captioned film are not yet implemented. The current app and uncaptioned walkthrough remain available.

Name: **mutiny — Cancer vaccine explorer**.

Central question: **What makes a cancer mutation a target for T cells?**

The demo combines a retrospective vaccine-response cohort with a clearly separate structural case. It must never imply that the HHAT structures belong to a selected pancreatic-trial patient, or that the structure explains every non-detected response.

## The three additions worth building

### 1. A 3D explanation with a specific payoff

Show the HHAT normal and mutant peptides on their experimental HLA scaffolds. The user can inspect three biological features: the mutation at position 8, the neighboring tryptophan at position 6, and the contacting receptor residue Tyr100α.

Use source-driven camera bookmarks and highlighting. Temporarily fade the HLA surface to reveal otherwise obscured atoms. Draw selected verified contact distances between explicit atom/centroid endpoints. A residue-displacement strip, calculated in the HLA coordinate frame, links each peptide position to both 3D views.

Switch between receptor-free and receptor-bound experimental states; optionally overlay the two coordinate sets as distinct ghosted structures. Never interpolate atoms as if the crystals recorded a trajectory. The important motion is the camera finding the evidence, not simulated molecular dynamics.

Add the paper’s actual receptor and peptide–HLA measurements only after the Rosalind evidence review. Label affinity, kinetics, and thermal stability according to the assay; do not put incompatible quantities on a shared scale. Static structures illustrate the mechanism; the experimental paper supports the functional interpretation.

Depends on: Rosalind `mechanism.json` and `evidence.json`. The existing atom selection, paired cameras and four structures provide the implementation base.

### 2. A response-capture slider with real consequences

Within the existing cohort, let the user choose how many already-administered targets to inspect, then switch ESM, binding and shuffle. Highlight the first k eligible marks and show how many measured responses they include. Keep excluded targets visible and preserve all outcome labels. Offer all patients; choose the initial patient before comparing model performance, not because it favors a model.

Label the control **Targets inspected**, not vaccine size. This is a retrospective ordering comparison within a selected cohort, not vaccine design. Show the same eligible targets and shuffle reference for every lens. The assay’s unresolved responding HLA class remains accessible beside the comparison.

Depends on: Rosalind `response-capture.json`, cross-checked against existing data. No training or new data cohort.

### 3. A 75-second film that opens into the real app

One storyboard should drive an explicit Play tour mode, a deterministic browser recording, and the caption timing. Each chapter stores scene, patient/target or residue, lens, receptor state, representation and camera bookmark. Users can pause or select **Explore this moment** to enter the corresponding live state. Keep the video controls standard and captions optional; no autoplaying narration.

The shareable film should show the real app, a short genuine Workbench evidence view, and the specific biological insight. Avoid cinematic decorative molecular fly-throughs that reveal nothing.

## Proposed storyboard

| Time | Picture | Narration intent |
|---|---|---|
| 0–12 s | Close-up of the normal/mutant HHAT peptides; highlight the changed position | Introduce how a single cancer mutation can change what a T cell encounters. Identify this as the ovarian structural case. |
| 12–29 s | Clearly titled pancreatic vaccine study; reveal responses across all patients | Establish the vaccine problem using measured outcomes. Explain that these targets were already administered and not every target had a detected response. |
| 29–43 s | One patient, k slider, ESM/binding/shuffle orderings | Ask how early each ordering recovers measured responses; retain all-patient access and label the comparison exploratory. Do not narrate a general winner. |
| 43–65 s | Return explicitly to HHAT; position 8 → W6 → receptor contact; discrete experimental-state comparison | Explain the source-supported structural and functional finding. Use only approved claims and real returned measurements. |
| 65–75 s | Actual Rosalind evidence/measurement artifact, then final live 3D state | State what Workbench actually produced; identify the plugins used and invite direct exploration. |

Final words and timings depend on the measured result and approved claim list. Do not attach draft captions to the existing unsynchronized recording.

## Deliverables

- `mutiny-demo.mp4`: approximately 75 seconds, 1920×1080, real app capture and clear narration.
- `mutiny-demo.en.vtt`: switchable English closed captions for the web player.
- `mutiny-demo.en.srt`: uploadable captions for supporting platforms.
- `mutiny-demo-social.mp4`: separate open-caption version for feeds that strip caption tracks.
- `demo-story.json`: chapter timing, interaction state and evidence-claim IDs; a plain transcript alongside it.
- Genuine Workbench screenshots and exact plugin credit, used only after the work is complete.

Caption style: concise, engaging and focused on the biological reveal. Write the narration that way first, then caption it faithfully. Aim for one short thought per cue, usually 4–9 words, with at most two short lines. Use concrete language and active verbs; avoid interface narration, filler and dense jargon. Preserve scientific meaning and necessary qualifiers rather than shortening a claim into something misleading.

Caption requirements: match the final audio, phrase-based timing, comfortable reading time, legible contrast, and no obstruction of the selected residue or measurement. Include meaningful non-speech audio if any. Check the full film muted, caption on/off, keyboard controls, pause/resume, reduced-motion preference and mobile playback. Captions are accessibility content; they should not add scientific claims absent from narration/evidence.

## Scope and order

1. Build the caption/tour infrastructure, k-slider interface and camera-bookmark controls locally.
2. Receive and review Rosalind structural measurements and evidence; integrate the supported biological story.
3. Capture the synchronized film, finalize captions against audio, and replace the README’s generic recording with the film link/poster.
4. Deploy and record the final public URL. Submit only when separately authorized.

Avoid additional tumors, new language models, synthetic immunogenicity probabilities, molecular-dynamics claims, survival prediction, or an unrelated NGS workflow. The improvement comes from one clearly demonstrated mechanism and one consequential interaction, not more panels.
