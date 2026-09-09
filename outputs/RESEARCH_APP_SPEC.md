# mutiny — reusable research application specification

Status: implementation proposal, not a claim of shipped functionality. Read with `RESEARCH_TOOL_PLAN.md` and `ROSALIND_HANDOFF.md`.

## 1. The product promise

**Bring cancer-vaccine candidates. Compare their rankings. Investigate the evidence. Save a reproducible review.**

A researcher already has candidate sequences and model outputs. mutiny helps the researcher understand those outputs and decide what deserves further investigation. It does not require a new pipeline, an account, model weights or Rosalind to open a project. Rosalind supplies optional, traceable scientific enrichment through a portable file exchange.

The useful first audience is a computational researcher working with an experimental collaborator. The deliverable of their session is an annotated research review, not a manufactured vaccine or a treatment decision.

The distinctive hypothesis is that model comparison becomes more useful when a ranking difference can be followed into exact sequence context, relevant experimental evidence, and verified molecular geometry. This hypothesis still needs user testing; import, annotation and export themselves are established features in tools such as pVACview.

## 2. One complete session

1. A researcher opens a local candidate table and selects two score columns or imports a supplied score manifest.
2. The importer asks what a row represents, what each score measures, its units and ordering direction. It shows concrete row errors and preserves unresolved values.
3. The researcher chooses one group/sample and the top ten eligible targets. Linked ranking views show the same identities under both methods and which targets change membership.
4. They select a target that moves substantially. Its sequence context, exact score values and available evidence appear together. No response is inferred from a model score.
5. They mark the target **Investigate**, add a note and export an evidence request for that target and two others.
6. In the Rosalind-enabled account, the scientific agent verifies the supplied references, retrieves relevant experiments and checks whether a suitable structure exists. It returns an evidence package, including explicit unresolved results.
7. The researcher imports the package. mutiny previews the matches and proposed changes; accepted evidence attaches to the selected candidates. A verified structure opens in 3D. An unmatched example remains explicitly separate.
8. They export a project ZIP and an annotated review. Their collaborator reopens the ZIP and recovers the same identities, scores, notes, evidence and selected view.

If measured responses are available, the researcher can also examine response capture under each ordering. If they are absent, the entire session still works; accuracy and response-capture displays are unavailable.

## 3. Screens and interactions

### Open

Two primary entries: **Open project** and **Explore example**. The example menu offers the Rojas response cohort and the independent HHAT structural case, each with its actual source. Do not imply that these are two views of the same patient.

Opening a CSV/TSV starts a compact import flow:
- Preview actual rows and map fields. A user can declare one group when their table contains only one analysis group.
- Define sequence role, analysis unit and score meanings. Known versioned example presets may prefill metadata; arbitrary numeric columns never receive invented model semantics.
- Resolve blocking errors or explicitly retain unresolved rows, then open the project. The confirmation shows imported, unresolved and blocked counts with downloadable row-level issues.

A saved project ZIP reopens directly after schema and content validation. Do not require the researcher to remap columns.

### Compare

Keep the current restrained visual style: an open figure, few controls and a selected-candidate inspector. Use linked rank lanes for the selected methods; connect/highlight the selected candidate and selected subset, not every row in a dense web of crossing lines. Use rank positions for comparisons across unlike units; show raw scores with units in the inspector.

Controls: group, method A, method B, **Targets inspected** (k), and outcome reveal when outcomes exist. Start with two methods; do not build an unlimited dashboard editor.

Top-k shows the intersection count and candidates unique to each ordering. Selecting a changed member preserves its identity as the order changes. If measured outcomes are eligible, show responses recovered out of the eligible positive total and the seeded shuffle reference. Keep excluded rows visible and selectable outside the ranked subset.

No automatically selected winner, hidden blend of scores, or candidate quality badge. Methods measuring distinct biological properties must remain identifiable as such. The control changes a retrospective inspection budget, not a proposed vaccine size.

### Investigate

A selected candidate has a sequence view and three compact sections: **Scores**, **Evidence**, **Review**. Show sections with meaningful content; do not fill missing evidence with boilerplate cards.

Sequence display identifies which sequence is being shown: tumor epitope, normal counterpart, source-protein context, or full source protein. Highlight mutations only when positions and mappings are verified. Expose exact HLA assignments and whether they are predictions or experimentally supported restrictions.

Evidence entries retain source and evidence type: published experiment, model prediction, computed geometry or interpretation. Clicking a structural entry opens the matching 3D view. A claim without a matching structure still has value as sourced experimental evidence.

Review state starts **Unreviewed**, with **Investigate** and **Reviewed** available. Annotations record text, candidate ID, optional reviewer label, timestamp and cited evidence IDs. These statuses do not mean accepted/rejected for treatment. A single-user project with file exchange is sufficient; no accounts or real-time collaboration in v1.

### Structure

Reuse the paired viewer, residue selection, surface/atom display and camera controls. For HHAT, add the validated mutation → W6 → receptor comparison from the Workbench evidence. Selecting a residue-displacement mark should focus that position in the corresponding measured states. Distance lines must use explicit endpoints and units from the evidence package.

An arbitrary project can display a supplied verified structural package. Automatic retrieval, arbitrary docking and structure prediction are not v1 prerequisites. HLA class II, other chain conventions and variable peptide lengths must not inherit HHAT's chain letters, nine-residue length or class-I alignment assumptions.

The absence of a structure must not prevent ranking review, annotation or export. Do not attach HHAT as the user's candidate structure. A related example must have a separate navigation context and explicit mismatches.

### Save

**Save project** downloads a portable ZIP. **Export review** downloads an annotated TSV and a concise HTML report with the current figures, filters, exclusions, evidence references and notes. HTML is a review document, not a replacement for the reopenable project archive.

An optional **Remember on this device** stores a local copy; automatic remote saving is not part of the product. A researcher can clear that copy. Browser import and local reopening must not transmit dataset content.

## 4. Proposed data contract, version 0.1

The other agent should review the scientific semantics and supply executable JSON Schemas. The following is the baseline contract to refine, not a claim that those schemas exist already.

| File/entity | Required meaning | Important constraints |
|---|---|---|
| `project.json` | Schema version, project ID, title, declared candidate/analysis unit, group definitions, source manifest, method definitions | Dataset identity is independent of display title. Unknown schema major versions cannot be silently accepted. |
| `candidates.tsv` | Candidate ID, group ID, primary mutant sequence ID; optional gene, variant and parent target IDs | Stable IDs, not gene names or row positions. Preserve parent relationships. |
| `sequences.tsv` | Sequence ID, amino-acid sequence, role, optional versioned reference and coordinate mapping | A vaccine target's mutant flank is not automatically its assayed epitope. Separate epitope and source-context sequences. |
| `scores.tsv` | Candidate ID, method ID, value/status, scored sequence ID, optional HLA context | Preserve which sequence and allele were actually scored. Model metadata supplies endpoint, units, direction and version. |
| `outcomes.tsv` | Assay ID, experimental unit ID, outcome state, endpoint, group, assay/time-point context and source | Outcomes belong to experiments. Do not duplicate an outcome when a target has multiple peptide–HLA predictions. |
| `assay-members.tsv` | Assay/experimental-unit ID and candidate membership, including pooled membership | Pool positivity cannot label individual members. Unknown membership remains unresolved. |
| `evidence.json` | Stable evidence/claim IDs, source locations, matched entities, evidence type, limitations, provenance | Every attachment is matched to the current dataset and candidate context. |
| `structures/` plus manifest | Coordinates, hashes, measured/predicted status, chain mappings, sequence/allele match, transforms and measurements | Display coordinates and measurement coordinates must have explicit frames. Never silently replace a verified structure. |
| `annotations.json` | Review states and notes linked to stable candidates/evidence | Preserve human-authored notes and version history needed to resolve imports. |
| `view.json` | Selected group, methods, k, candidate, filters, outcome visibility, random seed, optional structure bookmark | Reopening restores a view without rerunning a remote model or silently changing scores. |
| `manifest.json` | File paths, schema/version information, content hashes and source references | Import checks completeness and hashes; original inputs may be included when the researcher chooses. |

A convenient wide CSV importer can produce these normalized entities. A user need not manually create ten files. Optional entities can be empty or absent when the schema explicitly permits it.

### Minimum user-supplied table

A documented template should show candidate ID, group ID and mutant sequence. Mapping can generate stable project-local sequence IDs. If the user has no candidate IDs, offer a reproducible generated ID scheme and show it before import; do not use mutable display order as identity after import.

Optional score columns require declared method metadata. Optional normal sequence, gene, HLA and outcomes improve the available views but are not invented to fill the template. For a no-score project, allow sequence/evidence review while method comparison remains unavailable.

### Outcome vocabulary

Use explicit states: `detected`, `not_detected`, `pooled_unresolved`, `not_tested`, `missing`, and `unresolved`. Existing Rojas labels are mapped with a recorded transformation; a missing table value is not automatically known to mean not tested. A separately stored positive pool assay retains its own positive result while members remain unresolved.

No automatic conversion of qualitative labels from different assays into a universal binary endpoint. An import can display those labels, but a comparison must declare a compatible analysis slice.

## 5. Comparison rules that must survive generalization

1. Compare within a declared group and compatible analysis context. Do not rank across patients by default.
2. Order methods by the manifest's declared direction. Preserve raw values and units; do not normalize them into an unlabeled probability.
3. For methods A and B, construct the intersection of scoreable analysis units. Report missingness per method and the intersection denominator. Retain the excluded records for inspection.
4. For outcome evaluation, further restrict to compatible individually resolved outcomes. Save the assay endpoint, time point and restriction context used. Unknown responding HLA class remains unknown, including in the existing example.
5. In v1, require one unambiguous value per method per analysis unit for the chosen context. If multiple peptide/allele scores map to one assay unit, require an explicitly declared, saved projection rule or disable outcome evaluation. Do not choose the best-looking aggregation after revealing outcomes. The Rojas published best-pair input is a documented preset, not a universal rule.
6. Deterministically break ties by stable ID, disclose boundary ties and avoid presenting arbitrary tied order as biological separation. At minimum, mark that top-k membership crosses a tie; tie-sensitivity analysis can follow later.
7. Use 2,000 seeded within-group shuffles of the identical eligible experimental units for the response-capture reference. Do not shuffle duplicate copies of an outcome across peptide rows. The pointwise 90% range describes random ordering, not population uncertainty.
8. Groups with zero or all positive outcomes can show observed counts but have no informative discrimination comparison. Missing scores and empty eligible intersections produce a specific reason rather than a misleading empty graph.
9. Changing k never alters scores, eligibility or measured labels. Save filters and analysis configuration with exported results.
10. Curves are descriptive evaluation of a supplied dataset. Training/test independence and candidate selection history must be recorded when known; they cannot be inferred or certified by the interface.

## 6. The Rosalind exchange

### Request exported by mutiny

An evidence request contains a schema version, request ID, project fingerprint, selected candidate IDs, relevant sequence/allele/reference context, explicit questions and attached permissible sources. It includes only the chosen subset, not an automatic full-project upload. The researcher deliberately supplies it to the other account.

Default questions are concrete:
- Does the stated mutation match the supplied versioned sequence context?
- Which published experiments actually concern this peptide/allele or clearly identified related context?
- Is there an experimentally matching structure, and which chains/residues correspond to the candidate?
- Which measurements are supported, and what remains unknown?

### Package returned by the scientific agent

Include request ID and project fingerprint; per-candidate findings; exact source locations and evidence types; optional structure manifest and documented measurements; unsupported tasks with reasons; exact plugin/tool operations; input/output hashes; and proposed corrections separately from verified observations.

A reference match is not a validation of immunogenicity. A paper about the same gene is not automatically evidence for the same peptide. A predicted structure remains predicted. The agent should return useful negative search or unresolved mapping results without filling them with speculative evidence.

### Import behavior

Preview matched candidates, unmatched entries, duplicate evidence, conflicting references and proposed data corrections. Let the researcher accept valid attachments. Do not silently overwrite scores, reference sequences, outcomes or notes. The same package imported twice must not duplicate evidence. A package for a different project fingerprint requires explicit reconciliation, not approximate ID matching.

This is a file-based scientific workflow. The app does not need a live Rosalind API or proprietary model availability. Optional future integrations can automate the exchange after capabilities and data-transfer behavior are specified.

## 7. Implementation ownership and order

| Work package | Owner | Concrete exit condition |
|---|---|---|
| Scientific definitions and example normalization | Rosalind-enabled agent | Schemas, transformation code and provenance validate the existing labeled example plus an independently sourced permissible unlabeled fixture. |
| HHAT mechanism and experimental evidence | Rosalind-enabled agent | Independent reconstruction, new verified geometry comparison, source-backed experimental interpretation and actual Workbench execution evidence are committed. |
| Evidence request/return contract | Rosalind-enabled agent proposes and validates; original agent integrates | A selected-candidate request and matching response example validate, including an unresolved finding and a proposed correction. |
| Project engine and importer | Original agent | Arbitrary valid candidate IDs/groups/methods load; error cases are handled; no Rojas-specific scientific assumptions remain in the generic engine. |
| Review UI, comparison and persistence | Original agent | Linked rankings, k selection, annotations and local save/reopen operate for both fixtures and no-outcome/no-structure projects. |
| Evidence/3D integration and export | Original agent | Valid evidence attaches reproducibly, verified structural views render, exports reopen, mismatches stay explicit. |
| Video, narration and concise CC | Original agent, after GitHub updates and user returns | Recording uses the completed real app and verified claims; captions match the narration. Not assigned to the other agent. |

The other agent should commit its scientific work, schemas, fixtures and review notes to GitHub and report the SHA. It does not build the generic frontend or generate video. Unsupported optional tasks must not delay delivery of completed independent work.

## 8. Engineering outline for the original account

Separate the current fixed example from the reusable engine. Introduce a versioned project model, importer/validator, analysis-slice builder, ordering/reference functions, annotations store, evidence resolver and export/reopen module. Keep UI components dependent on that model rather than raw Rojas columns.

Adapt the current data through a source adapter before changing the UI. Preserve the existing scientific tests and add meaningful contract tests around imported projects, missingness, assay-unit duplication, deterministic comparisons, and round-trip exports. The HHAT viewer becomes a verified structural-project renderer with explicit chain/sequence/transform inputs; do not make its assumed chain letters a generic default.

Initial engineering targets, to measure rather than advertise prematurely: up to 10,000 candidate rows, 100,000 score rows and a 50 MB project archive on a normal desktop browser. Parse/compute in workers where needed and render only the relevant subset. Declare tested limits and fail gracefully above them. These are implementation budgets, not current performance claims.

Treat imported text as text, restrict external-link schemes, constrain archive extraction/size, and protect spreadsheet exports against formula execution. No dataset upload or remote model call occurs during import/comparison. Source links open only through the user's action. Local optional persistence is explicit and removable.

## 9. Release acceptance matrix

| Scenario | Required result |
|---|---|
| Existing Rojas project | 232 records and all original outcome distinctions survive; the documented 188-record comparison is reproduced. |
| Independent unlabeled project | New IDs and dimensions load; ranking overlap works; response accuracy is not fabricated. |
| Candidate has no structure | All core review and export actions remain usable; HHAT is not substituted as candidate evidence. |
| Two methods have missing values | Comparison uses the visible common denominator; excluded candidates remain inspectable. |
| A positive assay maps to several peptide–HLA rows | It is not counted repeatedly; a declared projection/analysis unit is required. |
| Pooled positive assay | Pool result is retained; members remain unresolved in individual evaluation. |
| Boundary score ties | Stable ordering is reproducible and arbitrary top-k membership is disclosed. |
| Evidence package is imported twice | No duplicate claims, attachments or structural records. |
| Evidence references another sequence/allele/project | Import previews the mismatch and does not silently attach it as exact evidence. |
| Save and reopen | IDs, scores, units, missingness, annotations, sources, filters and random seed recover exactly. |
| Browser network inspected during import | No imported candidate data, identifiers or sequences leave the browser. |
| Desktop and narrow viewport | Main review task is usable; camera and export controls remain accessible. |

Research usefulness needs a separate human check: an unfamiliar researcher should import a permissible table, investigate one ranking difference and hand a reopenable review to a colleague. Record what failed and whether they would use it again. Do not claim adoption or contact researchers without user authorization.

## 10. Build priorities and stop line

**First working slice:** import an unlabeled candidate table with two declared scores → inspect a ranking difference → add a note → export/reopen. This is the smallest proof that the app is reusable.

**Second slice:** preserve assay units and outcome states → enable measured response capture with explicit denominators → reproduce the frozen example.

**Third slice:** evidence request/export/import → verified HHAT mechanism and optional supplied structure packages → annotated evidence report.

**Showcase finish:** one consequential model comparison and one source-supported 3D mechanism, recorded from the real app with concise narration and closed captions. The existing public example remains a useful entrance for people without their own data.

Stop before generic pipeline execution, automatic vaccine selection, arbitrary TCR prediction, new model training, RNA cassette design, clinical recommendations, team accounts or cloud patient-data storage. Native pVACseq integration is a later versioned adapter, not a hidden requirement for v1.
