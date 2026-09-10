# Experimental density in mutiny

The **Superimpose in 3D** view compares exact deposited normal and mutant peptide coordinates in a common HLA frame. Switch between structures without interpolating atoms. For HHAT, **Experimental density** adds a local wireframe around the selected peptide residue. Selecting density from the two-structure overlay explicitly switches the visible structure to Mutant; Normal is also available. Only the selected structure's map is shown.

## Sources and processing

Four public PDBe maps are included: 6UJQ/6UJO (unbound) and 6UK2/6UK4 (receptor-bound). The source is `https://www.ebi.ac.uk/pdbe/coordinates/files/{id}.ccp4`, the PDBe 2Fo-Fc map channel. This addition is **local public-data processing, not a Rosalind execution**. Earlier Workbench map loading failed because of its workspace configuration; that did not prevent using public data here.

`scripts/prepare_density.py` reads CCP4 axis order, cell geometry and crystallographic symmetry with Gemmi 0.7.3. It expands the map to the full unit cell, rejects nonfinite coverage, and calculates the full-cell mean and standard deviation. It then:

1. Recovers each existing source-to-display rigid transform from common HLA A:1–180 Cα atoms. This recovers a transform within a single structure; it does not refit normal to mutant or fit a peptide.
2. Checks the proper rotation and independently checks every corresponding peptide atom against the existing display PDB. Maximum coordinate error is below 0.001 Å, consistent with the display PDB's rounded coordinates.
3. Samples the original map through the inverse transform using trilinear interpolation, on a 0.35 Å Cartesian grid covering the peptide plus a 3.5 Å margin.
4. Stores values in full-cell sigma units, using `(value - fullCellMean) / fullCellSD`. No crop normalization, sharpening or solvent masking is introduced. Grid spacing is a sampling choice, not crystallographic resolution.
5. Writes gzip-compressed little-endian float32 values, with z varying fastest. The browser verifies hashes, reconstructs the grid in display coordinates and contours within 2 Å of the selected residue at 0.7, 1.0, 1.3 or 1.6 σ.

[The manifest](../public/density/manifest.json) contains original map URLs and hashes, original and display coordinate hashes, full transforms, grid metadata, normalization statistics, and original-frame samples at all peptide atoms. Compressed assets total about 4.6 MB and load on demand; they are not downloaded on the default page.

## Checks and limits

The generator compares original-coordinate density samples with inverse-transformed display-coordinate samples; maximum errors must be below 0.02 σ. A separate Node test decodes each distributed grid and interpolates at the peptide atoms, checking against the recorded original-map samples (allowing smoothing from the second interpolation). Browser checks exercise all four maps, contour changes, residue selection, figure export and shared views. These are numerical and rendering checks, not an independent crystallographer's judgment of model quality.

Model-phased crystallographic density supports inspection of a model; it is not independent proof, a side-chain confidence score, or evidence of vaccine efficacy. Appearance depends on threshold and resolution. Maps are shown around peptide atoms only, not around the reconstructed receptor crystal mate. The normal HLA/receptor context is shown for the superposition; switching to Mutant switches that context as well. Both peptides remain in the same alignment frame.

## Reproduce

Use an isolated Python environment with NumPy and `gemmi==0.7.3`, then run:

```sh
python scripts/prepare_density.py
npm test
npm run test:focus-browser
```

The Python script caches unchanged public originals under ignored `work/density/`. The browser check starts a local preview of the built `dist` by default; use `npm run build` first. Set `APP_URL` to check another running server and optionally `CHROME_EXECUTABLE` for the local environment. Normal builds require no Python or external scientific service.

## Shared views

A link records the curated case, stage, selected residue, visible structures, density state, contour and camera in the URL fragment. It pins the coordinate and density-asset digest (including grid placement), rejects invalid or outdated states, and includes no uploaded PDBs or notes. The density asset is itself checked against its current manifest and exact display-coordinate hash. Links are views of the curated examples; saved investigations remain the portable format for local input pairs.
