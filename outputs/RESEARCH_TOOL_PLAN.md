# mutiny — from demonstration to reusable research tool

Status: proposed product extension; not implemented. The existing public example remains the starting experience. This plan broadens the software to user-supplied research projects while preserving the frozen scope and interpretation of the existing studies.

Detailed implementation contract: [RESEARCH_APP_SPEC.md](RESEARCH_APP_SPEC.md), including user flows, proposed data entities, outcome rules, Rosalind exchange, ownership and release checks.

## Product and user

**A visual review workspace for cancer-vaccine targets.**

Primary user: a computational researcher or cancer-immunology collaborator reviewing a candidate table and scores produced by an existing pipeline. Secondary users: biological-ML researchers comparing methods on published response datasets and educators explaining the evidence.

The repeatable job: **Bring a candidate table, find consequential ranking differences, inspect the evidence behind them, and export a review someone else can reproduce.**

Example: two methods put different already-identified candidates near the top. The researcher follows those candidates across rankings, checks what each score actually measures, verifies mutation/transcript/HLA context, attaches available experimental or structural evidence, and records what needs investigation. Scores for different biological properties may rank candidates differently without contradicting each other.

## Existing tools and honest differentiation

pVACview already supports neoantigen candidate upload, variant/transcript/peptide inspection, multiple prediction methods, ratings, comments and exports. Do not claim these are new inventions.

Sources:
- https://pvactools.readthedocs.io/en/latest/pvacview/pvacseq_module/pvacseq_upload.html
- https://pvactools.readthedocs.io/en/latest/pvacview/pvacseq_module/pvacseq_features.html
- pVACview paper: https://pubmed.ncbi.nlm.nih.gov/38947921/

mutiny's proposed focus is a lightweight, browser-based, pipeline-independent review and method-comparison workflow, with portable source-linked evidence and optional molecular inspection. Its differentiated value must be tested with researchers; neither adoption nor superiority has been demonstrated. Seek interoperability rather than reproducing pVACtools variant calling, candidate generation, tiering or all its review features.

## Version 1: one useful workflow

### 1. Open a research project

Load a generic CSV/TSV plus a small project/score manifest. Map columns once and save that mapping in the project. The existing Rojas study is a built-in example, not hardcoded application logic. A schema-defined ZIP reopens a complete saved project.

Minimum candidate fields: stable candidate ID, group/sample ID and mutant sequence with a declared role (such as epitope or source-protein context). The convenient importer may generate stable project-local IDs before confirmation, as specified in RESEARCH_APP_SPEC.md. Optional fields include gene, mutation, wild-type peptide, versioned transcript/protein, HLA allele, parent variant/target ID, expression data with units, source URL, assay metadata and measured outcome. Unavailable fields stay unavailable. Explicitly declare whether a row represents an administered target, a peptide, or a peptide–HLA pair; do not conflate these units.

Predictions live in a separate long-form score table: candidate ID, method ID, value, model version, biological endpoint, units, ordering direction and provenance. Require a manifest for numeric interpretation; never infer direction or treat all values as probabilities. Allow several scores for one candidate only when their contexts and identities remain distinct.

Validate duplicate IDs, sequence alphabets/length consistency, score joins, finite values, outcome vocabulary and reference conflicts. Report row-specific issues without silently discarding data. Accept unlabeled projects: measured outcomes are optional, not synthesized.

### 2. Compare and review

Linked candidate marks show how rankings change within a declared group. Clicking a candidate highlights the same identity across methods. A top-k control shows membership overlap and ranking differences. Label these as ranking differences; stronger binding and greater ESM sequence preference are different properties.

With comparable measured outcomes, enable response reveal and within-group capture curves against a seeded shuffle reference. Without outcomes, show overlap and rank changes only; do not display accuracy or simulated response labels.

Each method comparison displays the common eligible denominator and its exclusions. Keep unscored candidates visible. Preserve pooled, missing and untested outcomes. Do not conflate no assay with no detected response. Do not combine distinct assay endpoints, time points or responding HLA classes merely because both labels say positive. Analysis units must not duplicate the same experimental outcome across peptide/HLA rows; group to the declared assay unit or disable that comparison until resolved. Avoid cross-patient ranking by default.

Basic annotations are **Investigate**, **Reviewed** and a short note. These are research-review states, not a medical recommendation or an automatically approved vaccine shortlist. Record author-supplied label, time, target ID and evidence references; allow corrections. Never manufacture an overall immunogenicity score from ESM and binding.

### 3. Inspect evidence, including 3D where justified

The selected candidate connects sequence context, predictions and experimental evidence. Evidence records distinguish published experiments, model predictions, computed geometry and interpretation. Every record has a source, relevant sequence/allele/assay context, method and review status.

A structure can be linked to a user's candidate only when its peptide, allele, mutation and relevant chains are reconciled. Label measured structures versus predicted structures. A related structure may be shown as a related example with its mismatch explicit; it is never evidence for the user's candidate by substitution. Do not automatically model a receptor when its identity is unknown. Missing structures must not prevent use of the main review workflow.

Keep the HHAT normal/mutant comparison as a documented example project with its own structural evidence. Its reusable contribution is the measurement/display workflow and evidence schema, not attaching HHAT to other tumors.

### 4. Export and reopen

Export a project ZIP containing normalized candidates, original column mappings, score manifest, evidence references, source hashes, notes, review states, exclusions and saved view state. Also export an annotated TSV and a concise HTML review report with figures. A colleague should be able to reopen the ZIP locally and recover the same data, ordering and annotations.

Process imported files in the browser. Version 1 needs no account, database or API key. Import must not upload rows, sequences or identifiers to a server. Evidence packs are generated separately in the user's scientific environment and imported as files. Any future remote evidence request must be explicit about what leaves the browser. Share is a deliberate file export, not automatic publication.

## Rosalind's recurring role

Rosalind prepares a reusable **candidate evidence package** for the selected subset that needs investigation. The researcher exports those candidate IDs and their relevant context, works with them in their Rosalind-enabled account, then imports the returned package.

Work through actual available plugins to:
- Reconcile supplied mutation/flank/transcript context against explicitly versioned sequence references.
- Retrieve relevant papers and experimental measurements; preserve assay type, units and source locations.
- Find and inspect experimentally relevant peptide–HLA/TCR structures when they exist, with explicit match criteria and chain mapping.
- Produce documented structural measurements for supported cases and uncertainty/missingness for unsupported ones.
- Check model-comparison denominators, outcome definitions and analysis units.

This is optional for using mutiny but substantive when used: its outputs populate inspectable evidence and 3D views. Keep native plugin operations distinct from custom code run through Workbench. Exact capabilities must be verified in the other account. No claim that the app itself runs Rosalind or that a general language model's confidence is experimental evidence.

## Smallest worthwhile release

Ship generic table import, user-declared score semantics, linked rankings, optional measured-outcome evaluation, research notes, and lossless export/reopen. Add import of source-linked evidence packages; retain verified HHAT 3D as the worked example. Generic automatic structure analysis is a later extension, not a launch dependency.

A versioned pVACseq adapter is a follow-up after the generic contract works. The official pVACview aggregated report plus metrics format includes information at variant, transcript and peptide levels; conversion must preserve these relationships or explicitly declare losses. Do not imply full pVACseq compatibility from a few matching column names.

## Proof it is a tool rather than a fixed demo

Before claiming readiness:
1. Import and reopen two independently sourced example projects with different identifiers and sizes, one labeled and one unlabeled. Verify licenses before redistributing new examples. pVACtools' documented HCC1395 demo is a candidate for the unlabeled fixture, not automatically an experimentally response-labeled dataset.
2. Show that no patient numbers, record totals, outcome counts, score names or eligibility rules from Rojas are required by the generic project engine.
3. Verify exact round-trip identity, scores, missingness, annotations, evidence references and view state; make parsing and joins reproducible.
4. Confirm local file import sends no dataset content over the network and that malformed content cannot execute as markup or exported spreadsheet formulas.
5. Ask a small number of researchers to complete a concrete task using their own permissible table: inspect a ranking difference, record evidence and reopen their review. Collect feedback; do not claim researcher validation before it occurs. Do not contact people without user authorization.

## Keep the experience engaging

The landing experience offers the worked example or a local project. The live review stays visual and concise. The captioned 75-second film in `DEMO_PLAN.md` becomes an onboarding example of the same workflow: a ranking difference, a biological investigation, an exported review. The 3D mechanism remains the memorable scientific moment, and it is optional when a user's candidates lack structures.

## Scope limits

No FASTQ/VCF pipeline, new foundation model, mRNA cassette design, wet-lab protocol, treatment recommendation, clinical deployment, cohort-wide survival prediction, or hosted patient-data platform in version 1. Do not add unrelated sequencing work just to increase Rosalind usage.
