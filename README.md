# mutiny

**Which cancer mutations trigger T cells?**

Cancer vaccines teach T cells what to recognize. Choosing those targets is the hard part.

Inspired by Radical Numerics’ [Omnii cancer-vaccine post](https://www.radicalnumerics.ai/blog/omnii-cancer-vaccines), mutiny lets you explore real vaccine outcomes, protein-language-model scores, and the molecular encounter in 3D.

![Rotate normal and mutant peptide–HLA structures with their T-cell receptors, in linked views](outputs/screenshots/recognition-orbit.gif)

**Normal and mutant peptides meet the same T-cell receptor.** Four experimental structures, with synchronized cameras and measurable contacts. This HHAT case is independent of the vaccine trial below.

### Start with the targets

232 vaccine targets. 16 patients. Each mark is a target. Start with the labels hidden.

![Pancreatic cancer vaccine targets before revealing measured responses](outputs/screenshots/01-atlas.png)

### Reveal responses. Compare models.

Copper marks detected T-cell responses. Switch between ESM-2 sequence preference, predicted HLA binding, and chance; follow the same targets as their order changes.

![ESM-2 ordering with measured responses and a within-patient shuffle reference](outputs/screenshots/02-responses.png)

### Test the contact

Follow the mutation → neighboring W6 → receptor contact. Compare measured crystal poses, then explore what happened when researchers altered that contact residue.

![W6 in normal and mutant peptides, with the measured receptor-bound pose overlaid in gray](outputs/screenshots/14-w6-detail.png)

![Published experiments compare receptor binding for normal, mutant and altered HHAT peptides](outputs/screenshots/12-binding-experiment.png)

The comparison is exploratory: sequence preference and binding scores are not immune-response probabilities. [Biology, sources & limitations →](docs/SCIENCE.md)

### Bring your candidates

Open a project, compare rankings, follow a candidate, and save your notes. Includes an independent 11-candidate HCC1395 example. Project files stay in your browser.

![Two prediction methods rank the same candidates, with a saved review alongside](outputs/screenshots/08-research-review.png)

The first reusable release opens **normalized project JSON**. [Example file](public/research/hcc1395.project.json) · [Format and scope](docs/PROJECTS.md)

### Try it

```sh
npm ci
npm run dev
```

No API keys or GPU needed. Results and structures are included.

[Development](docs/DEVELOPMENT.md) · [Deploy](docs/DEPLOYMENT.md) · [Next Rosalind tasks](outputs/ROSALIND_FOLLOWUP.md) · [MIT license](LICENSE)

Built with results from **Molecular Structure Viewer** and **Life Sciences Literature** in the Rosalind environment. [Actual plugin contributions](rosalind/PLUGIN_EXECUTION.md).
