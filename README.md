# mutiny

**[Try mutiny →](https://callback-psi-liard.vercel.app)**

**Compare a normal and cancer-mutant peptide structure. See what changes beyond the mutation.**

![Explore the mutation, neighboring W6 and receptor contact in mutiny’s interactive 3D comparison](outputs/screenshots/mutiny-hero.gif)

[Still image](outputs/screenshots/16-hhat-export.png)

**Bring your pair.** Open compatible PDBs, inspect neighboring residues in linked 3D, and compare backbone or side-chain differences. Save your view or export a figure. Files stay in your browser. Or start with the published HHAT case: inspect the structures, make a prediction, then reveal the binding experiment.

![Per-residue structural differences from locally supplied normal and mutant coordinates](outputs/screenshots/18-residue-differences.png)

[Supported structures & file format](docs/STRUCTURE_COMPARISON.md) · [Example coordinates: normal](data/raw/6UJQ.pdb) / [mutant](data/raw/6UJO.pdb)

Inspired by Radical Numerics’ [Omnii cancer-vaccine post](https://www.radicalnumerics.ai/blog/omnii-cancer-vaccines). The **Vaccine study** view also compares ESM-2 and predicted HLA binding against 232 administered targets from 16 patients. HHAT is a separate structural case; geometry alone does not predict vaccine effectiveness.

![Vaccine targets ordered by ESM-2, with measured T-cell responses revealed](outputs/screenshots/02-responses.png)

```sh
npm ci
npm run dev
```

No API keys or model-compute setup needed. The interactive viewer uses WebGL. Experimental structures and completed model scores are included.

Built with evidence from **Molecular Structure Viewer** and **Life Sciences Literature** in the Rosalind environment. The reusable comparison engine runs locally. [Actual plugin contributions](rosalind/PLUGIN_EXECUTION.md) · [Next Rosalind work](outputs/ROSALIND_STRUCTURAL_COMPARISON.md)

Source tables and reference sequences are committed to preserve the exact bytes used in the analysis.

[Science](docs/SCIENCE.md) · [Development](docs/DEVELOPMENT.md) · [Deploy](docs/DEPLOYMENT.md) · [MIT license](LICENSE)
