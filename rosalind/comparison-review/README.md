# Independent comparison review — 2026-09-10

The pinned generic engine passes the independent numerical checks below. This is verification of a specific source hash, not approval of arbitrary biological inputs. No frontend files were changed. `engine-provenance.json` identifies the unmodified snapshot from commit `106c8fe82516524306caa8ecce46f43805bb4cab`.

## Measured agreement

| Pair / fit | Local NumPy SVD Kabsch | Native Molecular Structure Viewer | Matched Cα |
|---|---:|---:|---:|
| HHAT 6UJQ → 6UJO, whole HLA A | 1.0270032334 Å | 1.0270032013 Å | 275 |
| KRAS 7OW5 → 7OW6, shared HLA A:2–276 | 0.3372518399 Å | 0.3372518644 Å | 275 |
| KRAS shared platform A:2–180 | 0.2761543023 Å | Not independently run natively | 179 |

Arrows name normal/reference then mutant/mobile; mobile coordinates are fitted to reference. Native `structure.align_structures(method: structure)` performed Cα TM-align; explicit ordered atom-pair `structure.analyze(kind: rmsd)` also returned KRAS 0.337252 Å for 275 pairs with zero unmatched/ambiguous atoms. Native `method: sequence` initially returned a different, many-atom alignment and was superseded; it is **not** the Cα measurement. The `atoms` alignment route rejected object scope, so it was not used. Receipts and exact native Cα identities are in `native-comparisons.json`.

The generic quaternion result and independent float64 SVD oracle agree to 1e-9 Å for every accepted fixture's whole-HLA fit and every reported peptide backbone/common-side-chain RMSD. Rotation determinant is +1; a mirror reflection cannot fit exactly and collinear input rejects. Reparsed display PDB distances agree within 0.002 Å after 0.001 Å coordinate rounding. All peptide source chain/author-number/insertion identities are checked independently of normalized display A/C numbering. Independent HLA source/display maps are also exported; the generic return itself does not expose the same full HLA mapping.

For HHAT, generic W6 common-side-chain RMSD is **3.5026838600 Å** (10 atoms including CB) and backbone RMSD **1.0719515143 Å**. This is not the curated platform-aligned nine-atom fixed-indole-ring RMSD. Whole-HLA fitting allows the distal α3 domain to influence the frame; a declared platform comparison is more directly tied to the peptide groove. Neither is universally the correct frame; report the region and atom set with the number.

## Executable fixtures

`build_fixtures.py` makes labeled controlled derivatives from authentic HHAT inputs. They test parser and measurement behavior, not new experimental conformations. Original bytes and transformed-fixture hashes are retained. `fixtures.json` contains exact full expectations; `engine-results.json` records tested results.

| Fixture | Current engine | Interpretation |
|---|---|---|
| Authentic free HHAT pair | Accept | One L8F substitution, equal observed HLA |
| Renamed author chains | Accept | Explicit H/P assignment preserved |
| Shifted numbering and insertion C:205A | Accept | Source identity survives display normalization |
| Entire HLA A:100 removed | Reject | Observed HLA sequence mismatch |
| HLA A:100 Cα alone removed | Accept, 274 Cα | Sequence remains observed; fitting intersection loses one atom |
| All W6 side-chain atoms removed | Accept; side-chain null | No common side-chain atoms, not zero displacement |
| W6 CG alone removed | Accept, reduced atom set | Different completeness changes the metric; atom list matters |
| Free normal / bound mutant | Numerically accept | Receptor-state confounding prevents mutation-only attribution |
| Declared predicted provenance | Numerically accept | Metadata-only test using copied experimental coordinates; **no prediction was run** |
| Blank plus A altloc, A has higher occupancy | Accept, blank preferred | Current parser's deterministic policy is not highest occupancy |
| Zero-occupancy W6 | Accept | Current calculation includes zero-occupancy coordinates; do not call this validated support |
| Symmetric phenyl labels exchanged | Accept, P8 1.8053745160 Å | Same point set, exchanged CD/CE labels; apparent motion is a naming artifact |

KRAS original 7OW5/7OW6 rejects exactly as intended: 275 versus 276 observed HLA residues. Its manually audited shared-reference comparison is scientific evidence for a proposed extension, not a backdoor accepted preset. PDB SEQRES A, D and E match between deposits. Bound peptides are complete; free mutant central peptide is incomplete. See `../contrast-kras/coverage.json`.

## Proposed versioned rule, not implemented in the app

Keep existing strict whole-observed-chain semantics unchanged as `strict-observed-hla-v1`. Introduce a separate opt-in `reference-mapped-hla-v2` request; never reinterpret a saved v1 result. Require original input hashes, coordinate provenance, receptor state, declared HLA/reference sequence with source/version/hash, an explicit one-to-one source-residue → reference-position mapping for **each** input, and a declared fit region (`whole-reference` or a versioned platform position list). Author numbers alone are not a general cross-file mapping. Reject ambiguous correspondence, sequence contradictions, duplicate identities, multiple mutations and incomplete peptide position mapping; do not infer missing residues from shortened observed strings.

The v2 measurement manifest must list every candidate reference position, both source identities, inclusion status and reason (outside region, residue absent, Cα absent, excluded occupancy/altloc). For these KRAS files, SEQRES identity plus matching observed author positions supports the checked mapping: full construct positions 1–276, normal position 1 absent, mutant present; 275 common whole-chain Cα. Platform positions 1–180 give 179 common Cα. Exclusion is explicit in `independent-comparison.json`; no edited deposit is supplied as an original. Region changes produce a new measurement identity.

For v2, require at least three noncollinear matched Cα and publish coverage fraction plus missing-position runs; biological suitability still requires review. Reject zero-occupancy fitting atoms by default, with exclusions recorded. Altloc policy must be explicit: coherent chosen conformer plus shared blank atoms, or separately enumerated conformers; fail on incompatible/missing choice. Never choose each atom independently by highest occupancy. Preserve v1's blank/A behavior in old files. Predicted provenance remains declared/unverified unless independently sourced; missing confidence or B-factor semantics must not be guessed. Mixed receptor states require a visible confounded-comparison label before interpretation.

Peptide comparisons retain exact atom lists and missing expected atoms. Empty side-chain sets (including glycine) and the differing mutation side chain return null with separate reasons. Partial common sets remain explicitly partial. Optional symmetry-aware RMSD must be a separately named, versioned metric with the actual allowed chemical permutation recorded alongside the original name-based result; this includes valine/leucine branch labels as well as aromatic rings. Never silently replace the metric. KRAS V3/V8 name-based side-chain values around 2.09/1.46 Å need this caveat despite small backbone changes.

Tests cover the current contract and the two explicit KRAS region mappings; they do not claim a general v2 importer exists. Review-state/evidence-digest proposal `../exchange-v0.2/` remains separate and deferred; its version number does not enact this structural proposal.

## Supported operations and limitations

Exact plugins used: **Molecular Structure Viewer**, **Biological Sequence & Alignment Viewer**, and **Life Sciences Literature**. Native structure sessions opened authentic local deposits; added objects, queried exact atoms, aligned Cα and measured distances. Native sequence range queries verified both KRAS peptide strings. Literature's prescribed PMC script resolved the primary open article. Local Python/Node calculations are labeled local; no numeric computation is presented as plugin execution unless a receipt exists.

One legacy viewer distance control resolved primary WT despite a mutant object request. We preserved those receipts as WT-only, then used typed `structure.measure` and `structure.query` to verify the mutant atom identities (`../contrast-kras/native-contacts.json`). No false mutant contact is included in the case.

Density remains blocked by unbound workspace-read roots. Source-relative image publication succeeded but grants no density-read capability. The bounded failed calls and all-four-state wwPDB residue validation are in `../SECOND_RETURN.md` and `../experimental-support.json`. No map is loaded, inspected, exported, clipped, downsampled or attached to an aligned frame. Whole-residue RSCC is not a side-chain certainty score.

Reproduce offline from repository root with `PYTHON=/path/to/python NODE=/path/to/node bash rosalind/analysis/run_structural_review.sh`. Python requires NumPy and Biopython; Node requires no added packages. The frozen source ensures upstream app changes do not silently change this review. Fresh source retrieval is separate (`../analysis/retrieve_kras.py`) and never needed to run checks.
