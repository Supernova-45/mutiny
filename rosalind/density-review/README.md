# Bounded density review — 2026-09-10

Native map inspection remains **unavailable**. An authentic deposited 6UJQ object was added to the live structure session in its deposited frame, selected as active, and one public-density request was made. It failed before acquisition with: “Workspace read access is unavailable because active workspace roots were not bound to this viewer session.” See [native-attempt.json](native-attempt.json). No map was loaded, visually inspected, rendered or exported; no 6UJO native load was attempted after that failure. No alternate path bypassed the denied capability.

The app's local PDBe/Gemmi assets were reviewed independently as distributed files. This is **local NumPy/gzip analysis, not a Rosalind map operation**. [check_distributed.py](check_distributed.py) does not import the producer script or Gemmi and changes no app/public asset. It verifies 6UJQ/6UJO raw/display PDB and compressed-grid hashes, little-endian float32 length/finite values, the z-fastest grid convention, proper orthonormal transforms, forward/inverse peptide correspondence, and independently interpolates every recorded peptide atom in the distributed grid. Full source URLs/hashes are in [distributed-check.json](distributed-check.json).

| Entry | Maximum peptide coordinate error | Maximum distributed-vs-recorded original sample difference |
|---|---:|---:|
| 6UJQ | 0.000813226 Å | 0.252050 σ |
| 6UJO | 0.000715144 Å | 0.461585 σ |

The density comparison uses **recorded** original-map sample values; it does not independently authenticate those samples. A second interpolation of the 0.35 Å grid can smooth/change values, so these differences are not a direct frame-error measurement. Coordinate agreement is independently checked. The default isovalue is 1 σ in the declared full-cell convention, not an interpolated-atom confidence threshold.

Original CCP4 bytes were not loaded here. Therefore CCP4 axis permutation, symmetry expansion, non-orthogonal cell handling and the original full-cell mean/SD are **not independently verified** by this return. The source manifest declares β=92.273° for 6UJQ, so treating the cell as orthogonal would be inappropriate; this review does not prove the producer's expansion is correct. Source script inspection confirms the intended `setup=True` Gemmi path, source-to-display inverse sampling and normalization before cropping, but code inspection is not experimental map validation.

No defensible new visual judgment of 1.0 σ versus 0.7–1.6 σ is supplied without inspecting the original maps. Lower contours can connect weak features; higher contours can fragment support. The 2 Å model-centered mask limits what is visible and must not be interpreted as an independent test for alternative conformations outside it. The current source/limits text discloses model phasing, full-cell sigma, resampling, 2 Å masking and local Gemmi provenance. Whole-residue RSCC/RSRZ from the prior return are not side-chain certainty scores.

Source-level superposition checks found no concrete labeling discrepancy in the reviewed paths: overlay context uses the normal model, Mutant mode switches context to the mutant model; density selects only one HHAT state; no molecular interpolation is used; KRAS is labeled JDIa41b1. This is a read-only code/text review, not a browser rendering test. No new frontend or public-data changes were made.

Reproduce the limited local check from repo root with a Python environment containing NumPy: `python rosalind/density-review/check_distributed.py`. The reviewed manifest hash is pinned in the result. Density limitations do not block the app; genuine Workbench UI capture is separately pending in `../showcase-captures/README.md`.
