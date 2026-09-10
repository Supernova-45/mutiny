# Deploy mutiny to Vercel

The app is a static Vite/React application. All scientific outputs and coordinates are served locally from `public/`; no backend or model API is required.

1. Import the GitHub repository `Supernova-45/mutiny` into Vercel.
2. Framework preset: Vite. Root directory: repository root.
3. Install: `npm ci`. Build: `npm run build`. Output: `dist`.
4. Use Node.js 22. No environment variables are required.
5. After deployment, verify 232 marks, response reveal, all four orderings, the four PDB states, evidence drawer, downloads, and a narrow mobile viewport.

The public production app is [callback-psi-liard.vercel.app](https://callback-psi-liard.vercel.app), verified without authentication on 2026-09-10. GitHub records automatic Vercel production deployments from this repository. Deployment-specific URLs may require Vercel login; use the public production domain for sharing. This account has not changed Vercel access settings. Accepted scientific plugin contributions are recorded in [PLUGIN_EXECUTION.md](../rosalind/PLUGIN_EXECUTION.md); do not describe all Rosalind work as pending. This app has no authentication, analytics or private patient records; it republishes attributed study data.

For the showcase, capture final app screenshots plus screenshots of actual Rosalind Workbench analysis. Include exact plugin names and their real contributions. The analysis is exploratory; avoid model-superiority and clinical-efficacy claims.

## Deployment verification

`npm run test:deployment` checks a built `dist/` through a temporary Vite preview, including the lazily loaded KRAS route, both rendered structures and the measured binding reveal. To check production, first check out the commit reported by the Vercel deployment, run `npm ci && npm run build`, then run `APP_URL=https://callback-psi-liard.vercel.app/ npm run test:deployment`. An optional `CHROME_EXECUTABLE` selects an installed Chrome; otherwise install Playwright Chromium.

The check compares SHA-256 hashes of every served build file with local `dist/`: HTML, all entry/lazy JavaScript and CSS, fonts, scientific JSON and coordinate files. It then verifies the visible heading, source identities and revealed measurements in Chromium. A string search in the entry bundle alone is insufficient: `Molecule` (including KRAS) is loaded in its own chunk, while `App.tsx` contains the global evidence text.

The existing Check workflow runs this against its local production preview. `Verify deployed mutiny` runs after successful Vercel Production deployments, rebuilds the exact deployment SHA and checks the public alias. Newer production events cancel older parity runs. Verified hashes and browser screenshots are retained as workflow artifacts. A failure detects a mismatch; it does not redeploy or alter access settings automatically.
