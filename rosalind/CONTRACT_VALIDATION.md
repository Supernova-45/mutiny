# Contract validation

Run `python rosalind/analysis/validate.py`; detailed results are in `validation.json`.

23 checks pass across Rojas (232 candidates), HCC1395 (11 unlabeled candidates), the separate HHAT project and a matched evidence request/return. Checks cover JSON Schemas and foreign keys, lossless JSON reopening, frozen 188/22/166 eligibility, excluded 10:39, two positive pools with seven unresolved members, distinct source-context/predicted-epitope roles, duplicate assay outcomes across rows, missing scores, direction, units, finite values, IDs, schema versions, exact project/sequence/reference joins, idempotent imports and unapplied proposed corrections. Negative fixtures are in-memory mutations used only as software tests, never scientific measurements or response labels in released datasets.

The structural validation additionally checks exported PDB distance endpoints against full-precision JSON (within 0.002 Å rounding tolerance), source HLA residuals and whole-residue SASA against existing prepared measurements, 180 aligned HLA Cα atoms, null unmatched L/F sidechain comparison and HLA-only sensitivity. Response generation checks all four orderings and 2,000 seeded shuffle references against an independent exact six-permutation example; tests use a declared toy outcome pattern solely to verify arithmetic.

`cohort-validation.json` is regenerated from the checksum-pinned XLSX. The adapter independently reads all 232 source rows and checks identities, response labels and both HLA annotation pairs against the cached cohort before normalization. All original cohort fields remain in the Rojas fixture. Generic project evaluator tests fail closed on multi-row assay projections, rather than multiplying positive labels.

The Rojas retrospective output deliberately reuses the app's `localeCompare` tie-breaking for exact compatibility. The proposed generic contract uses stable Unicode code-point ID order; the original agent should implement this explicitly for browser-independent results. Boundary score ties are exported. The two rules are recorded as separate contexts; neither is biological separation.

Not tested: a generic frontend, actual CSV mapping UI, browser network traffic, safe ZIP extraction, HTML/TSV export escaping, device persistence, or user adoption. JSON roundtrip validation does not establish those behaviors. Actual Rosalind Workbench execution is unsupported in this session.
