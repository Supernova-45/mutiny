# Proposed scientific identity and evidence exchange 0.2.0

This is a separately versioned proposal and executable reference implementation. It does not change the existing 0.1.0 schemas, reinterpret old fingerprints, or enable a frontend importer. The current reviewer can keep opening/saving normalized 0.1.0 JSON. Agreement and explicit migration are required before using this exchange.

## Identity layers

1. `projectId` is the project namespace, preserved across review sessions. Import must compare it exactly, even if biological contents happen to match another project.
2. `scientificDigest` identifies the complete scientific snapshot: candidates and their original source fields, sequences and reference/mapping context, HLA, predictor metadata, scores, sources, assays, assay membership, exclusions, analysis configuration and transformation provenance. Changing any of these creates a new snapshot. It is not a mutable revision counter.
3. `contextDigest` identifies the exact requested contexts: sorted candidate IDs; each complete candidate row; its primary and score-linked sequences and explicit paired normal sequence; predictor methods, scores and source records. Peptide, HLA, transcript version, variant and unknown/null values are preserved exactly. No HLA synonym folding, transcript upgrades, whitespace cleanup, genome-build inference or peptide case conversion occurs during hashing.
4. `requestDigest` binds the complete immutable request, including request ID, project/snapshot/context identities, selected IDs, exact contexts and ordered questions. A return echoes these identities. `returnDigest` binds the complete return except itself.

`reviewState` contains title, annotations, view, human notes and review-side proposed corrections. It is outside both scientific and request-context digests. The import ledger and returned evidence are separate from both science and review state. A human can edit notes or camera/selection, save, reopen and attach a pending return without losing those edits. A return does not replace notes, alter outcomes, apply corrections or silently update scientific fields.

This proposal deliberately rejects an old return after **any** scientific snapshot change, including predictor metadata, an unselected candidate, source location fields, or an unchanged-score/new-model-version declaration. Selected-context equality alone never overrides that rejection. This conservative rule avoids attaching an evaluation to changed predictor provenance. Future selective rebinding would need another explicit reviewed protocol; it is absent here.

## Canonicalization: `mutiny-canonical-json-1`

The named profile is pinned rather than described vaguely as “sorted JSON.” `exchange.mjs` is its executable definition:

- Parse strict JSON. Reject duplicate object keys, non-finite numbers, integers outside the IEEE-754 safe-integer range, lone Unicode surrogates and non-JSON values. Validate against the applicable versioned schema before semantic checks.
- Preserve Unicode code points exactly; do **not** normalize NFC/NFD. Sort object member names by ECMAScript UTF-16 code-unit ordering. Encode strings with ECMAScript `JSON.stringify`; numbers use its finite binary64 serialization, including `-0` → `0`. Hash UTF-8 bytes without BOM or final newline using SHA-256. Other language implementations must reproduce this number serialization; generic Python `json.dumps` is not a substitute.
- Before the scientific hash, sort known table arrays: groups/sources/candidates/sequences/methods by unique `id`; scores by `(candidateId, methodId, context)`; outcomes by `assayId`; memberships by `(assayId, candidateId)`; exclusions by `(candidateId, scope, reason)`. Compare tuple keys by their canonical JSON text. Reject duplicate keys rather than choosing a row. Preserve all other array order, including nested original source values, loss descriptions and questions.
- Context candidates and selected IDs use UTF-16 ID order. Within each context sort sequences/methods/sources by ID and scores by `(methodId, context)`. Null and missing fields are distinct; required fields cannot be omitted. Unknown source reference values stay unknown.
- Domain separation is explicit: the science hash wraps `{profile, scientificData}`; the context hash wraps `{profile, contexts}`. Requests and returns include `schemaVersion` and `identityProfile` in their hashed bodies.

`canonical-vectors.json` contains canonical bytes and hashes for interoperability. Digests establish content identity, not authenticity, evidence quality or user authorization.

## Explicit migration

Validate an existing file against the untouched 0.1.0 project schema, then call `migrate01`. Create a new 0.2.0 file; preserve the old file. Move only top-level `title`, `annotations` and `view` into `reviewState`; start `notes` and `proposedCorrections` empty. All other fields stay in `scientificData`, including scientific notes in assay rows and transformation provenance. Existing annotation objects are preserved verbatim; do not reinterpret them as measured facts.

Record `migration.fromVersion`, `policy` and the original document's digest **under the new named canonicalization profile**. That migration digest is not the old Python-generated `projectFingerprint`. Never rename a 0.1.0 fingerprint to `scientificDigest`. Existing 0.1.0 requests/returns remain governed by their old matching rules; they do not automatically become compatible. Issue a new 0.2.0 request to use this exchange.

Repeated explicit migration after a 0.1.0 reviewer changes only title/annotations/view produces the same science/context digests while preserving new human state. This case is tested, as is editing the migrated 0.2.0 review state.

## Exact attachment and idempotence

Persist pending requests immutably, keyed by `(projectId, requestId, requestDigest)`. If a request ID is reused with a different digest, treat it as a different request requiring explicit replacement, not an update to the pending request. On import:

1. Strictly parse and validate project/request/return schemas; recompute the project's scientific digest and the original pending request digest.
2. Recompute selected contexts from current science. Require exact project ID, scientific digest, context digest, request ID, request digest and selected-ID order equality. Recompute the return digest.
3. Require exactly one finding for every requested candidate. Claims referenced by a finding must exist and include that candidate. Reject duplicate claim IDs in a single return, foreign candidate references and automatic corrections. Non-resolved findings require reasons. An unresolved/no-exact-match finding does not imply a negative response outcome.
4. Stage validation before changing the ledger. Scope return and claim IDs to project ID plus scientific digest. Identical return ID/content gives `already_imported`; changed content under the same return ID fails. Identical claims across separate returns deduplicate by ID and content hash; conflicting content under the same claim ID fails. No partial import occurs.
5. Retain evidence, provenance and proposals separately. Return the current project unchanged. The caller must persist the returned ledger atomically with evidence and preserve its current review state.

This reference is a Node module using built-in crypto; a browser implementation can use the same canonical text with `TextEncoder` and Web Crypto SHA-256. The original account owns that implementation. No rendering, network behavior, HTML escaping, archive extraction or production storage atomicity is certified here.

## Executable verification

From the repository root:

```sh
python rosalind/exchange-v0.2/build_schemas.py
node rosalind/exchange-v0.2/build-roundtrip.mjs
node rosalind/exchange-v0.2/test-exchange.mjs
python rosalind/exchange-v0.2/validate_schemas.py
```

Python requires the existing jsonschema dependency. The build consumes retained actual plugin receipts and source fixtures; it does not claim a new live plugin run. Twenty-one semantic tests cover note/reopen, camera edits, changed peptide/HLA/reference/predictor metadata/score, foreign projects, duplicate imports and claims, collisions, unresolved findings, correction isolation, table ordering, request changes and explicit migration. Both HCC1395 and Rojas are exercised; pool membership, exclusions and unresolved 10:39 remain intact.
