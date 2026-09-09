# Portable research contract proposal 0.1.0

The contract supports researcher-supplied candidate identities, sequences, declared score semantics, optional experiments, annotations and review state. It validates the existing 232-target example and 11 independent HCC1395 peptide–HLA candidates, plus a separate two-candidate HHAT structural project. This is a validated **file-contract proposal**, not a deployed generic product or usability finding.

## Semantics and proposed deviations from RESEARCH_APP_SPEC

Normalized tables are embedded arrays in `project.json` for executable validation. These correspond directly to the proposed candidates/sequences/scores/outcomes/assay-members TSVs. A future archive adapter can externalize tables without changing their meaning. The portable evidence schema accepts optional structural states; HHAT is an instance, not a default chain, allele, peptide length or analysis unit. Arbitrary projects need no structure or outcomes.

Candidate IDs are distinct from target, variant and peptide–HLA identities. Rojas primary sequences are mutant **source contexts**, while predicted epitopes are separate sequences and ESM points to the verified WT protein. Scores carry endpoint, units, direction, version and scored sequence/HLA. HCC1395 underlying predictor versions are not reported in the table: the artifact commit is pinned separately, and `versionStatus=not_reported` must remain visible. Do not turn it into a certified predictor revision.

Outcomes belong to uniquely identified experiments. They are joined through membership records; multi-row projection is disabled by the reference evaluator until implemented explicitly. The Rojas single-target preset is recorded, not generalized. Two patient-25 positive pools are separate outcomes with no invented member assignments; a separate unresolved pool-set record links the seven rows and is explicitly not a third experimental assay. No-data remains missing, never not-tested or negative. Timepoint and responding restriction remain null where unavailable.

`computed_validation` is added as an evidence type so sequence/label audits are not mislabeled as geometry. Unknown structure-specific metadata can extend the structural manifest, but required coordinate hashes, measured/predicted status, chain roles and frame transforms remain validated. The `sourceRow` field is an adapter entry for the HHAT PDB-derived fixture, explicitly documented rather than a false PDB line number. A future minor version should replace it with a general source locator before broad adapters ship.

## Import/reopen and evidence exchange

Project fingerprints are SHA-256 over UTF-8 JSON encoded with sorted keys, compact separators and ASCII escaping. Array order is significant. All persisted project content, including view and notes, is included; therefore editing any content invalidates an old fingerprint and requires explicit reconciliation. This conservative proposal should be tested against workflows needing separate immutable dataset and mutable review fingerprints.

The request includes only selected candidates and their exact sequence/role/HLA/reference context. A return must match request ID, project ID, fingerprint, candidate set and contexts. Duplicate claim import under the same fingerprint/ID/content is a no-op; conflicting content under a stable ID is rejected. Conflicting references, changed sequence/allele, unknown schema version and foreign fingerprints cannot attach automatically. Proposed corrections are separate and never mutate project fields. Unresolved target 10:39 demonstrates useful partial returns.

`manifest.json` hashes artifact paths; project sources have their own hashes. JSON round trips preserve fields, numbers, nulls, originals, annotations and view state in executable tests. Archive extraction safety, browser-local import, ZIP reopen and network silence require the original agent's implementation and testing. No claim of browser validation is made here. The reference code is intentionally conservative and not a production importer.

## Independent fixture and reuse

HCC1395 comes from the public pVACtools filtered class-I demonstration TSV at commit `c76ea9d26d549d479affe9ce31f551295fadcde7`. The repository's BSD-3-Clause-Clear license is retained alongside the raw TSV. The official documentation identifies the demonstration as HCC1395 tumor cell line with matched HCC1395BL. No sequencing datasets or models were downloaded. No immune response labels were supplied or invented.

All 11 source rows are normalized, with deterministic IDs derived from genomic variant/transcript/allele/peptide/sub-peptide-position identity. Two existing IC50 prediction columns are exposed; all source columns remain in `original`, and the complete raw table remains available. This is not a full pVACseq aggregated/metrics adapter. Source hashes and declared transformation losses are in the fixture and manifest.

## Comparison with existing tools

pVACview already provides variant/transcript/peptide exploration, prediction comparisons, evaluations, comments and export. Its pVACseq module uses aggregated TSV plus metrics JSON and offers HCC1395 demo loading. Mutiny should not claim these as novel features. Its proposed value is a compact, pipeline-independent comparison/review format with explicit assay-unit semantics and portable source-linked molecular evidence. Whether that is useful enough to adopt remains untested.

Sources: [pVACview features](https://pvactools.readthedocs.io/en/latest/pvacview/pvacseq_module/pvacseq_features.html), [upload and demo](https://pvactools.readthedocs.io/en/latest/pvacview/pvacseq_module/pvacseq_upload.html), [pVACtools source/license](https://github.com/griffithlab/pVACtools/tree/c76ea9d26d549d479affe9ce31f551295fadcde7). Documentation observed as version 7.1.3 on 2026-09-09.

Untested assumptions: researchers will declare endpoints/directions correctly; resolve multi-peptide assay projections; understand experimental versus predicted sequence roles; exchange evidence files; and find the review sufficiently useful relative to pVACview. No researchers were contacted. Generic frontend, clinical selection, automatic structure generation and hosted patient-data services remain outside this work.
