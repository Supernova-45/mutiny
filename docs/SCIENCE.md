# Scientific methods and interpretation

## Frozen question

Among targets already selected and administered in one cancer-vaccine cohort, how do measured ELISpot outcomes distribute under two exploratory sequence/binding orderings? A separate experimental case illustrates molecular recognition. The structural case does not explain trial-specific response differences.

This is a descriptive resource, not a new immunogenicity model, a clinical predictor, or a replication of Omnii's benchmarks or RNA design pipeline. No statistical-significance or model-superiority claim is made.

## Data and exclusions

The raw Supplementary Table 5 file has SHA-256 `c9942caa0de461e87c3725ae42377fea2a283cd170074fb2e36820303b429595`. The parser uses patient number plus neoantigen number as the record identity; gene names alone are not unique.

232 records comprise 23 individual positives, 200 non-detected responses, seven pool members and two missing outcomes. Patient 25 has three individual positives plus seven candidates belonging to two responding pools. The paper's figure counts the two pool responses in its reported 25. We do not identify a positive member or impute a negative member. Which of the seven candidates belongs to which pool has not been encoded.

Both class-I and class-II predicted peptide/allele fields exist on every record. They are not experimental restriction labels. The ELISpot endpoint does not distinguish CD4/CD8 responses for every target. Predicted class-I affinity may therefore be inapplicable to the mechanism underlying some measured responses; displaying it does not turn the endpoint into a binding assay.

## Reference reconciliation

216 records pass the metadata-only filter: a supplied transcript, wild-type flank, and a single-residue substitution of the form A123B. We retrieve the listed RefSeq transcripts as GenBank records, record their returned versions and CDS protein accessions, and require both:

1. The annotated wild-type amino acid at the stated source-protein position.
2. An exact match of the supplied wild-type flank anchored at that position, with exactly the stated substitution in the mutant flank.

197 records pass. There is no gene-name substitution, fuzzy rescue or silent position shift. The resulting model-score subset contains 188 individually labeled targets: 22 positive and 166 non-detected responses. The other nine mapped targets have pooled or missing outcomes. Positive target `10:39` is excluded because the supplied sequence context does not pass strict current-reference reconciliation; its observed outcome is preserved. A different reference version might resolve this, but doing so requires explicit evidence and a new audit.

## ESM-2

Checkpoint `facebook/esm2_t33_650M_UR50D`, revision `08e4846e537177426273712802403f7ba8261b6c`.

For each verified mutation, choose up to 511 wild-type protein residues, centered on the mutation except when shifted to fit a terminus. Mask the single mutation site. Compute:

`log P(mutant amino acid | masked WT context) − log P(WT amino acid | same context)`

The log-probability difference equals the corresponding logit difference. We use a frozen evaluation-mode model and no training. More negative values appear first, following an exploratory sequence-disruption hypothesis fixed in the model lock before outcome association inspection. No direction is selected by performance.

This is not distance to the human proteome, TCR specificity, immune foreignness, or response probability. Richman et al. ([2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6813910/)) provides related motivation for studying dissimilarity from self; its evidence does not validate this ESM score.

## MHCflurry

Python package 2.1.4; released `models_class1_pan` bundle (20200610 download), loaded `models.combined` predictor. `data/derived/model-files.json` records the actual downloaded model-file hashes. The published mutant class-I epitope and its published best-predicted allele are passed as a pair. We do not search all patient alleles or replace missing full HLA genotypes with the union of selected alleles.

The scalar is predicted binding affinity in nM; lower values appear first. These are model predictions, not measured affinities or presentation probabilities. All 232 pairs were scoreable in this run.

## Comparing orders

The same eligible set is used for ESM, binding and shuffle within each patient. Unranked records remain dimmed, in published order after the eligible group. Pooled/missing outcomes and unscored targets are excluded from cumulative response calculations. Patient views without both positive and negative eligible records do not show a chance-comparison chart.

The curve shows cumulative detected responses as an ordering is traversed. The reference consists of 2,000 seeded Fisher–Yates random orderings of the identical eligible patient set, preserving the number of positive labels. Its shaded interval contains the pointwise central 90% of shuffled counts; it is not a confidence interval for population performance. Repeated shuffles are reproducible and are not additional observations.

## Experimental HHAT structures

Normal peptide: KQWLVWLLL. Mutant peptide: KQWLVWLFL. Source substitution HHAT L75F is peptide position 8; neighboring position 6 is tryptophan. HLA-A*02:06 is used in all four structures. 6UJQ and 6UJO are unbound pMHC; 6UK2 and 6UK4 contain normal and mutant receptor-complex coordinates, respectively.

**Crystal-mate recovery is essential.** The asymmetric units place TCR chains D/E in a translated cell relative to pMHC A/B/C. Apply identity rotation plus deposited cell translations to D/E: 6UK2 (+a, −b, 0); 6UK4 (0, +b, 0). Searching deposited symmetry operations with translations −1..1 found exactly one peptide-contacting TCR mate for each structure. These translations reproduce the paper's Trp6–Tyr100α contact; the Trp6 indole N to Tyr100α ring-centroid distances are approximately 3.31 Å in both structures. This is recovery of a crystallographic mate, not receptor docking or a binding trajectory. Subsequent native viewer checks on the prepared coordinates are recorded in [the plugin execution log](../rosalind/PLUGIN_EXECUTION.md); crystal-mate reconstruction itself remains attributed to the local pipeline.

Align on common HLA chain A Cα positions 1–180 using Kabsch fitting to 6UJQ. Never fit the peptide or receptor. Apply one common display rotation. HLA platform RMSDs are 0.0000, 0.2556, 0.5411 and 0.4731 Å for 6UJQ, 6UJO, 6UK2 and 6UK4. Rendering displays the HLA platform and, when selected, receptor variable-region residues 1–115 for visual clarity. Measurements use the complete reconstructed protein complex.

Solvent accessibility: Biopython Shrake–Rupley, 1.4 Å probe, 200 points per atom, protein-only complex; per-residue areas include the entire residue and are not the paper's hydrophobic side-chain-only areas. Contacts: unique receptor residues containing a heavy atom within 4 Å of the selected peptide residue. These are geometric neighborhoods, not automatically hydrogen bonds or energetic contributions. The viewer switches discrete experimental states without interpolating a molecular trajectory.

## Contribution boundary

Cohort preparation, ESM/MHCflurry scoring, crystal-mate recovery, HLA fitting, SASA and the web comparison engine were run locally. Subsequent Life Sciences Literature and Molecular Structure Viewer executions supplied retained metadata, native measurements and renders; their exact operations and limits are documented in [PLUGIN_EXECUTION.md](../rosalind/PLUGIN_EXECUTION.md). Prepared-structure native checks do not reattribute the earlier reconstruction or fitting to the plugin. The later [structural return](../rosalind/STRUCTURAL_RETURN.md) independently reviewed the comparison engine and verified the curated KRAS identities, alignment and contacts, with operation-specific receipts. The new HHAT density overlays were prepared locally from public PDBe maps with Gemmi; [their method and checks](EXPERIMENTAL_DENSITY.md) document the coordinate transforms, full-cell sigma scaling and limitations. Independent Workbench inspection of these new map crops remains a useful follow-up. Use the execution receipts for showcase attribution; local processing is not a Rosalind execution.
