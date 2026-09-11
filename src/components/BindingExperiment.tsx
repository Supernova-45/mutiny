import { ArrowUpRight } from "lucide-react";

export interface Ligand {
  id: string;
  group: string;
  label: string;
  p8: string;
  p6: string;
  claimId: string;
  value: number | null;
  sd: number | null;
  n: number | null;
  status: string;
  structureIds: string[];
}
export interface HhatEvidence {
  sourceUrl: string;
  experiments: Ligand[];
  provenance: { inputs: { path: string; sha256: string }[] };
  comparisons: { states: string[]; rmsd: number; atoms: string[] }[];
  contacts: {
    state: string;
    start: number[];
    end: number[];
    value: number;
    endpoint: string;
    displaySha256: string;
  }[];
}

const groups = [
  {
    id: "original",
    label: "Original peptides",
    result: "The cancer mutant binds 302TIL more tightly.",
  },
  {
    id: "analogue",
    label: "W6 analogue",
    result: "Changing W6 weakens binding on both backgrounds.",
  },
  {
    id: "alanine",
    label: "W6 alanine",
    result: "Neither W6 alanine variant had detectable binding.",
  },
  {
    id: "position8",
    label: "Position 8 alanine",
    result: "Replacing position 8 with alanine also weakens binding.",
  },
];
// Shared log scale, 1–3,000 μM. Unmeasurable results have no x coordinate.
const x = (value: number) => (100 * Math.log10(value)) / Math.log10(3000);

export default function BindingExperiment({
  data,
  group,
  onSelect,
}: {
  data: HhatEvidence;
  group: string;
  onSelect: (group: string) => void;
}) {
  const active = groups.find((g) => g.id === group)!;
  return (
    <section className="binding-experiment" aria-labelledby="binding-title">
      <div className="experiment-heading">
        <div>
          <h2 id="binding-title">Does that contact matter?</h2>
        </div>
        <a
          className="study-link"
          href={data.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Measured binding · Table 1 <ArrowUpRight size={13} />
        </a>
      </div>
      <div className="experiment-layout">
        <div className="experiment-choice">
          <div
            className="experiment-options"
            aria-label="Published peptide experiments"
          >
            {groups.map((g) => (
              <button
                key={g.id}
                aria-pressed={g.id === group}
                className={g.id === group ? "selected" : ""}
                onClick={() => onSelect(g.id)}
              >
                {g.label}
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <p className="experiment-result" aria-live="polite">
            {active.result}
          </p>
          {group !== "original" && (
            <p className="experiment-caveat">
              Assay results only. The 3D views show the original normal and
              mutant peptides.
            </p>
          )}
        </div>
        <figure
          className="binding-plot"
          aria-label="Published 302TIL equilibrium SPR binding measurements"
        >
          <div className="binding-axis">
            <span>Kᴅ · μM</span>
            <div>
              {[1, 10, 100, 1000].map((t) => (
                <span key={t} style={{ left: `${x(t)}%` }}>
                  {t.toLocaleString()}
                </span>
              ))}
            </div>
            <span>mean ± SD</span>
          </div>
          {data.experiments.map((row) => {
            const selected = row.group === group;
            const baseline = row.group === "original";
            return (
              <button
                key={row.id}
                className={`binding-row ${selected ? "selected" : ""} ${baseline ? "baseline" : ""} ${row.p8 === "F" ? "mutant" : "normal"}`}
                aria-label={`${row.label}: ${row.value === null ? "binding not detected" : `${row.value} plus or minus ${row.sd} micromolar`}`}
                aria-pressed={selected}
                onClick={() => onSelect(row.group)}
              >
                <span className="ligand-name">{row.label}</span>
                <span className="binding-range">
                  {[1, 10, 100, 1000].map((t) => (
                    <i
                      className="plot-grid"
                      key={t}
                      style={{ left: `${x(t)}%` }}
                    />
                  ))}
                  {row.value !== null ? (
                    <>
                      <i
                        className="binding-error"
                        style={{
                          left: `${x(row.value - row.sd!)}%`,
                          width: `${x(row.value + row.sd!) - x(row.value - row.sd!)}%`,
                        }}
                      />
                      <i
                        className="binding-dot"
                        style={{ left: `${x(row.value)}%` }}
                      />
                    </>
                  ) : (
                    <span className="unmeasured">Not detected</span>
                  )}
                </span>
                <span className="binding-number">
                  {row.value === null ? (
                    "—"
                  ) : (
                    <>
                      {row.value.toLocaleString()} <small>± {row.sd}</small>
                    </>
                  )}
                  <small>{row.n ? `n = ${row.n}` : "Limit not reported"}</small>
                </span>
              </button>
            );
          })}
          <figcaption>
            <span>← Tighter binding</span>
            <span>302TIL receptor · SPR · 25 °C</span>
          </figcaption>
        </figure>
      </div>
      <details className="experiment-methods">
        <summary>What was measured</summary>
        <p>
          Equilibrium binding of the 302TIL T-cell receptor to
          peptide–HLA-A*02:06. Points show published means; whiskers show
          standard deviations. Lower Kᴅ means tighter binding. These
          measurements do not measure peptide–HLA affinity or vaccine
          effectiveness. Bta is an experimental tryptophan analogue,
          3-benzothienyl-L-alanine. No numeric detection limit is reported for
          the W6 alanine variants.
        </p>
        <a href="/data/hhat-evidence.json" download>
          Download measurements & provenance <ArrowUpRight size={12} />
        </a>
      </details>
    </section>
  );
}
