# Candidate projects

Choose **Your candidates** in mutiny. Open the HCC1395 example, select a candidate in either ranking, change the number inspected, add a note, and **Save project**. Opening the downloaded file restores the candidate, methods, cutoff, notes and review status.

This release accepts normalized JSON matching [project schema 0.1.0](../rosalind/project.schema.json). The [downloadable HCC1395 example](../public/research/hcc1395.project.json) shows the complete format. A general CSV mapping screen and ZIP archive support remain planned; arbitrary pVACseq TSV files cannot yet be opened directly.

## What the comparison means

- Rankings use the declared score direction within one group. Different methods retain their original endpoint and unit; scores are not converted into immune-response probabilities.
- Both methods must have one available score for a candidate, referring to the same sequence and HLA. Multiple score contexts require an explicit projection and are excluded in this release. Missing and incompatible rows remain inspectable.
- The cutoff controls how many candidates are inspected. The overlap counts shared candidate IDs in the two lists. Ties are ordered by stable ID and flagged when they cross the cutoff.
- Response outcomes, original columns and source records are preserved when saving. This new review view does not evaluate response accuracy. The existing pancreatic-vaccine view retains its documented outcome analysis.
- Review states mean unreviewed, investigate or reviewed. They do not mean clinically selected or rejected. No structures are automatically attached to imported candidates.

## Files and privacy

Opening, comparing and saving imported projects happen locally in the browser. There is no upload, backend or automatic remote model call. Source links open only when clicked. The bundled HCC1395 example is downloaded from the same static site when selected. Notes survive switching app tabs; save a file before closing or reloading the page or replacing the project. Browser storage is not used automatically.

Imports are capped at 8 MB JSON, 10,000 candidates and 100,000 score records; these are validation caps, not a performance benchmark. The first 100 ranks are rendered; the candidate selector and exported project retain all rows. The browser workflow has been exercised on the 11-candidate fixture. The scientific unit tests also cover missing and incompatible contexts, score ties, schema failures and round-trip preservation.

## Rosalind exchange

The current scientific [request/return proposal](../rosalind/PRODUCT_REVIEW.md) needs a versioned separation between scientific identity and mutable notes/view state. Evidence request/return import will follow that refinement. For now, the app incorporates the verified HHAT case as a separate example; it does not claim a working generic evidence importer.

## Attribution

The HCC1395 example originates from the pinned public pVACtools filtered class-I demonstration. All 11 rows and their original columns are preserved. Predictor versions were not reported; the pinned source commit is not a predictor version. No experimental immune-response outcomes are supplied. The [Clear BSD license](../public/research/pvactools-LICENSE) accompanies the redistributed fixture.
