# Second scientific return — 2026-09-10

All work in this return is under `rosalind/`. Existing 0.1.0 schemas and integrated first-return measurements are unchanged. No frontend or generated public assets were edited.

## Experimental support

A fresh Molecular Structure Viewer session opened authentic deposited 6UJQ and added deposited 6UJO, 6UK2 and 6UK4. Default assembly 1 and identity object transforms were retained; the HLA-aligned comparison files were not used. A supported related-data probe and one public-density load both reported that active workspace-read roots were not bound. Tool discovery found no callable root-binding operation. Source-relative publication and explicit structure addition do not establish the missing root capability. The bounded attempt stopped without an alternate download or authorization bypass.

**Map status:** available channels are 2Fo–Fc and Fo–Fc; maps were **not loaded, inspected or exported**. No interactive map assets, sampled grids, contour settings or map transforms are supplied. `experimental-support.json` records those unavailable fields explicitly rather than inventing values. The prior discovery receipt retains provider URLs and precision choices. No map-export licensing claim is made because no map assets were delivered.

Native wwPDB validation succeeded for all four entries. All returned pages for RSCC, RSRZ and geometry are retained in `plugin-results/hhat-validation-all-states.native.json`; `experimental-support.json` supplies all nine peptide residues, deposited source hashes, exact author identities, and local altloc/occupancy inspection. Run `analysis/summarize_validation.py` to regenerate this summary from the receipts and deposited PDBs.

| Entry | W6 RSCC | W6 RSRZ | P8 RSCC | P8 RSRZ |
|---|---:|---:|---:|---:|
| 6UJQ, normal free | 0.892 | 0.627 | 0.951 | −0.346 |
| 6UJO, mutant free | 0.918 | 1.030 | 0.958 | −0.440 |
| 6UK2, normal bound | 0.949 | 0.519 | 0.946 | 0.650 |
| 6UK4, mutant bound | 0.971 | −0.404 | 0.959 | −0.431 |

Sources are each entry's native-imported [6UJQ](https://files.rcsb.org/validation/view/6ujq_validation.xml), [6UJO](https://files.rcsb.org/validation/view/6ujo_validation.xml), [6UK2](https://files.rcsb.org/validation/view/6uk2_validation.xml), and [6UK4](https://files.rcsb.org/validation/view/6uk4_validation.xml) wwPDB report. These are published **whole-residue** validation metrics, not new density calculations or side-chain certainty. W6/P8 have no geometry issue types in the returned mapped rows. The deposited W6/P8 ATOM records have blank alternate-location labels and occupancy 1.0; this does not exclude unmodeled conformations or disorder.

A relevant neighboring caveat is 6UJQ peptide L4: RSCC 0.697, RSRZ 3.211 and a reported clash issue. The lower W6 correlation in free normal than bound structures is descriptive, not evidence that the mutation caused a change in data quality. Different crystals, resolutions and refinement matter. Without loaded maps we cannot visually confirm the proposed indole orientation or inspect difference density around it.

## Real three-candidate evidence round trip

`roundtrip-v0.2/request.json` and `return.json` bind the first three candidates of the pinned HCC1395 fixture exactly. Source TSV lines are 2–4. Both native sequence strings per candidate were queried from Biological Sequence & Alignment Viewer and independently compared with the pinned table.

| Candidate | Mutant / normal | HLA | Versioned transcript |
|---|---|---|---|
| MSH6 Asp1255Asn | VENYSQNVA / VEDYSQNVA | HLA-B*45:01 | ENST00000234420.11 |
| ZNF548 Asp24Tyr | VVFEYVAIY / VVFEDVAIY | HLA-A*29:02 | ENST00000336128.12 |
| ABL2 Thr753Ala | APRLIKKTL / TPRLIKKTL | HLA-B*82:02 | ENST00000502732.6 |

Variant IDs, genomic reference/alternate bases, HGVS and source-row originals are carried without modification. Genome assembly remains unspecified; fixture identity verification is not a new transcript/genome reconciliation. No structures or response labels are fabricated.

Life Sciences Literature 0.1.5 executed six targeted PubMed searches on 2026-09-10: each exact mutant peptide string and each gene/HGVS context. All returned zero results, with quoted-phrase warnings retained. Each candidate therefore receives a scoped `no_exact_match` finding, not a universal assertion of no evidence. Search dates, exact queries, translations, counts, warnings, raw responses and plugin receipts are present. PubMed indexing does not exhaust full text, supplements, IEDB, patents or unpublished work.

The broader HCC1395 search returned three records. The [ImmunoNX preprint, PMID 41415611](https://pubmed.ncbi.nlm.nih.gov/41415611/) describes a pVACtools/pVACview workflow demonstrated on HCC1395; it is returned only as **related workflow context**, with PubMed identifying it as an ArXiv preprint. Its retrieved abstract does not establish an experimental match for these exact peptide/HLA pairs. The other two cell-line papers were screened as unrelated to these epitope identities. No same-gene or same-cell-line result becomes an exact epitope claim.

`analysis/search_hcc_evidence.py` reproduces the plugin calls using the installed plugin's prescribed JSON interface and public inputs. `exchange-v0.2/build-roundtrip.mjs` checks the retained native sequences, source mutation positions and search receipts before building the fixtures. The demonstration import adds zero outcomes and preserves human/scientific state.

## Contract proposal

`exchange-v0.2/README.md` defines immutable scientific identity, separate review state, an exact requested-context digest, canonicalization/order rules, explicit migration and idempotent attachment. Three new schemas, the reference implementation and 21 semantic tests are supplied. Existing 0.1.0 remains untouched; no new frontend importer is implied.

Notes and camera/selection edits survive save/reopen. Changed peptide, allele, reference, predictor metadata or score reject stale evidence. Foreign-project returns, conflicting IDs and duplicate claim IDs reject; identical reimports are idempotent. Unresolved returns and human proposals stay distinct from science and outcomes. Rojas pool units/exclusions and 10:39 are preserved in migration tests; the ovarian structural case stays separate from the pancreatic cohort.

Remaining unsupported work: bound-session density loading and local map export/inspection; exhaustive exact-epitope literature review; new reference reconciliation; production browser import/storage behavior. No new predictors, remote model runs, videos or frontend implementation were used.
