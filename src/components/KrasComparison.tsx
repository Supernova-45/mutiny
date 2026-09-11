import { useCallback, useEffect, useRef, useState } from "react";
import * as mol from "3dmol";
import {
  ArrowUpRight,
  FileUp,
  ImageDown,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import CuratedCases from "./CuratedCases";
import InvestigationActions from "./InvestigationActions";
import ExperimentJump from "./ExperimentJump";
import FocusComparison from "./FocusComparison";
import { downloadFile, exportFigure, hashText } from "../lib/investigation";
import {
  animateView,
  cameraBetween,
  molecularStyle as colors,
  styleViewer,
} from "../lib/molecular-style";
import {
  parseKrasInvestigation,
  type KrasInvestigation,
  type KrasPrediction,
  type KrasScene,
} from "../lib/kras-investigation";
import type caseData from "../../public/data/kras.json";
import "../kras.css";
type Evidence = typeof caseData;
const steps = [
  { id: "peptide", title: "The mutation", detail: "G6 → D6" },
  { id: "contacts", title: "Inside the HLA groove", detail: "Q70 · R114" },
  { id: "receptor", title: "The engineered receptor", detail: "JDIa41b1" },
] as const;
const predictions = [
  ["normal", "Normal"],
  ["mutant", "Mutant"],
  ["similar", "Similar"],
  ["cannot-infer", "Can’t tell from shape"],
] as const;

function Stage({
  index,
  texts,
  data,
  scene,
  residue,
  overlay,
  reset,
  restore,
  orbit,
  onViewer,
  onPick,
}: {
  index: number;
  texts: string[];
  data: Evidence;
  scene: KrasScene;
  residue: number;
  overlay: boolean;
  reset: number;
  restore: number[] | null;
  orbit: boolean;
  onViewer: (i: number, v: mol.GLViewer | null) => void;
  onPick: (n: number) => void;
}) {
  const div = useRef<HTMLDivElement>(null),
    viewer = useRef<mol.GLViewer | null>(null),
    initial = useRef<number[]>(null),
    fitted = useRef(false);
  const pick = useRef(onPick);
  pick.current = onPick;
  const [error, setError] = useState(""),
    [ready, setReady] = useState(false);
  const signature = `${scene}/${residue}/${overlay}/${reset}`,
    [rendered, setRendered] = useState("");
  useEffect(() => {
    if (!div.current) return;
    const element = div.current;
    try {
      const v = mol.createViewer(element, {
        backgroundColor: colors.background,
        antialias: true,
      });
      viewer.current = v;
      styleViewer(v);
      initial.current = v.getView();
      v.addModel(texts[index], "pdb");
      v.addModel(texts[0], "pdb");
      v.addModel(texts[1], "pdb");
      v.setClickable({ model: 0, chain: "C" }, true, (a: mol.AtomSpec) => {
        if (a.resi) pick.current(a.resi);
      });
      onViewer(index, v);
      const observer = new ResizeObserver(() => {
        v.resize();
        v.render();
      });
      observer.observe(element);
      return () => {
        observer.disconnect();
        onViewer(index, null);
        v.spin(false);
        v.clear();
        element.replaceChildren();
        viewer.current = null;
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "WebGL is unavailable.");
    }
  }, [index, texts, onViewer]);
  useEffect(() => {
    const v = viewer.current;
    if (!v) return;
    let cancelled = false,
      interrupted = false;
    const interrupt = () => {
      interrupted = true;
    };
    const element = div.current;
    element?.addEventListener("pointerdown", interrupt);
    setReady(false);
    const draw = async () => {
      try {
        const from = v.getView();
        v.spin(false);
        v.removeAllShapes();
        v.removeAllLabels();
        v.setStyle({}, {});
        v.setStyle(
          {
            model: 0,
            chain: "A",
            resi: Array.from({ length: 180 }, (_, i) => i + 1),
          },
          {
            cartoon: {
              color: colors.hla,
              opacity: scene === "peptide" ? 0.22 : 0.16,
            },
          },
        );
        v.setStyle(
          { model: 0, chain: "C" },
          {
            stick: {
              radius: 0.17,
              color: index ? colors.mutant : colors.normal,
            },
            sphere: {
              scale: 0.24,
              color: index ? colors.mutant : colors.normal,
            },
          },
        );
        v.setStyle(
          { model: 0, chain: "C", resi: 6 },
          {
            stick: { radius: 0.23, color: colors.mutation },
            sphere: { scale: 0.29, color: colors.mutation },
          },
        );
        if (residue !== 6)
          v.setStyle(
            { model: 0, chain: "C", resi: residue },
            {
              stick: { radius: 0.22, color: colors.selected },
              sphere: { scale: 0.28, color: colors.selected },
            },
          );
        if (overlay && index === 1)
          v.setStyle(
            { model: 1, chain: "C" },
            { stick: { radius: 0.065, color: colors.reference, opacity: 0.7 } },
          );
        if (scene === "contacts") {
          v.setStyle(
            { model: 0, chain: "A", resi: [70, 114] },
            {
              stick: { radius: 0.17, color: colors.selected },
              sphere: { scale: 0.21, color: colors.selected },
            },
          );
          for (const contact of data.contacts.filter(
            (c) => c.pdb === data.structures[index].id,
          )) {
            const point = (a: typeof contact.peptideAtom) =>
              v.getModel(0).selectedAtoms({
                chain: a.chain,
                resi: a.residue,
                atom: a.name,
              })[0];
            const a = point(contact.peptideAtom),
              b = point(contact.hlaAtom);
            if (!a || !b)
              throw Error(
                "A contact atom is absent from the displayed structure.",
              );
            v.addLine({
              start: { x: a.x!, y: a.y!, z: a.z! },
              end: { x: b.x!, y: b.y!, z: b.z! },
              dashed: true,
              color: colors.connector,
              linewidth: 2,
            });
            v.addLabel(`${contact.distanceAngstrom.toFixed(2)} Å`, {
              position: {
                x: (a.x! + b.x!) / 2,
                y: (a.y! + b.y!) / 2,
                z: (a.z! + b.z!) / 2,
              },
              fontSize: 12,
              fontColor: "#f0eee8",
              showBackground: true,
              backgroundColor: colors.background,
              backgroundOpacity: 0.7,
              borderThickness: 0,
            });
          }
        }
        if (scene === "receptor") {
          for (const chain of ["D", "E"])
            v.setStyle(
              {
                model: 0,
                chain,
                resi: Array.from({ length: 115 }, (_, i) => i + 1),
              },
              { cartoon: { color: colors.receptor, opacity: 0.68 } },
            );
          for (const chain of ["D", "E"])
            v.addStyle(
              {
                model: 0,
                chain,
                within: { distance: 4.5, sel: { model: 0, chain: "C" } },
              },
              { stick: { radius: 0.12, color: colors.receptor } },
            );
        }
        v.setView(initial.current!, true);
        // Both panels fit the same reference selection, including both mutation shapes.
        // Only the camera moves; all three models retain their deposited, HLA-aligned coordinates.
        if (scene === "contacts") {
          v.zoomTo({
            model: 1,
            or: [
              { chain: "C", resi: 6 },
              { chain: "A", resi: [70, 114] },
            ],
          });
          v.rotate(25, "x");
          v.zoom(1.4);
        } else if (scene === "receptor") {
          v.zoomTo({ model: 1, chain: "C" });
          v.rotate(62, "x");
          v.rotate(20, "y");
          v.zoom(1.4);
        } else {
          const positions = [
            Math.max(1, residue - 1),
            residue,
            Math.min(10, residue + 1),
          ];
          v.zoomTo({
            or: [
              { model: 1, chain: "C", resi: positions },
              { model: 2, chain: "C", resi: positions },
            ],
          });
          v.rotate(20, "y");
          v.zoom(1.15);
        }
        if (restore) v.setView(restore, true);
        const target = v.getView();
        v.setSlab(-100, 100);
        if (fitted.current && !restore) {
          v.setView(from, true);
          await animateView(
            420,
            (t) => v.setView(cameraBetween(from, target, t), true),
            () => cancelled || interrupted,
          );
        }
        if (cancelled) return;
        v.render();
        fitted.current = true;
        setRendered(signature);
        setReady(true);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    void draw();
    return () => {
      cancelled = true;
      element?.removeEventListener("pointerdown", interrupt);
    };
  }, [data, index, scene, residue, overlay, reset, restore, signature]);
  useEffect(() => {
    const v = viewer.current;
    if (index === 0 && ready) v?.spin(orbit ? "vy" : false, 0.25, true);
    return () => {
      v?.spin(false);
    };
  }, [orbit, ready, index]);
  return (
    <div
      className="structure-stage"
      data-ready={ready && rendered === signature && !error}
      aria-busy={!ready || rendered !== signature}
    >
      <div
        ref={div}
        className="molecule-canvas"
        aria-label={`Interactive ${index ? "mutant" : "normal"} KRAS structure ${data.structures[index].id}`}
      />
      {!ready && !fitted.current && !error && (
        <div className="viewer-loading">
          Loading {data.structures[index].id}…
        </div>
      )}
      {error && (
        <div className="viewer-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default function KrasComparison({
  onHhat,
  onOwnPair,
  initialSession,
}: {
  onHhat: (session: KrasInvestigation | null) => void;
  onOwnPair: (session: KrasInvestigation | null) => void;
  initialSession: KrasInvestigation | null;
}) {
  const [loaded, setLoaded] = useState<{
      data: Evidence;
      texts: string[];
      hash: string;
    } | null>(null),
    [loadError, setLoadError] = useState("");
  const [scene, setScene] = useState<KrasScene>(
      initialSession?.view.scene ?? "peptide",
    ),
    [residue, setResidue] = useState(initialSession?.view.residue ?? 6),
    [overlay, setOverlay] = useState(initialSession?.view.overlay ?? true);
  const [prediction, setPrediction] = useState<KrasPrediction>(
      initialSession?.prediction ?? null,
    ),
    [revealed, setRevealed] = useState(initialSession?.revealed ?? false);
  const [restore, setRestore] = useState<number[] | null>(
      initialSession?.view.camera ?? null,
    ),
    [reset, setReset] = useState(0),
    [orbit, setOrbit] = useState(false),
    [expanded, setExpanded] = useState(false),
    [error, setError] = useState("");
  const viewers = useRef<(mol.GLViewer | null)[]>([null, null]),
    input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const response = await fetch("/data/kras.json");
      if (!response.ok) throw Error("KRAS evidence could not be loaded.");
      const raw = await response.text(),
        data: Evidence = JSON.parse(raw),
        hash = await hashText(raw);
      const texts = await Promise.all(
        data.structures.map(async (s) => {
          const r = await fetch(s.path);
          if (!r.ok) throw Error(`Could not load ${s.id}.`);
          const text = await r.text();
          if ((await hashText(text)) !== s.alignedSha256)
            throw Error(`Source check failed for ${s.id}.`);
          return text;
        }),
      );
      if (initialSession)
        parseKrasInvestigation(JSON.stringify(initialSession), hash);
      if (!cancelled) setLoaded({ data, texts, hash });
    };
    void load().catch((e) => {
      if (!cancelled) setLoadError(e.message);
    });
    return () => {
      cancelled = true;
    };
  }, [initialSession]);
  const register = useCallback((i: number, v: mol.GLViewer | null) => {
    viewers.current[i] = v;
    const [a, b] = viewers.current;
    if (a && b) {
      a.linkViewer(b);
      b.linkViewer(a);
    }
  }, []);
  useEffect(() => {
    if (!expanded) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = prior;
      document.removeEventListener("keydown", escape);
    };
  }, [expanded]);
  const snapshot = (): KrasInvestigation | null =>
    loaded
      ? {
          kind: "mutiny-kras-investigation",
          version: 1,
          evidenceSha256: loaded.hash,
          prediction,
          revealed,
          view: {
            scene,
            residue,
            overlay,
            camera: viewers.current[0]?.getView() ?? null,
          },
        }
      : null;
  const select = (next: KrasScene, n = 6) => {
    setOrbit(false);
    setScene(next);
    setResidue(n);
    setRestore(null);
    setReset((x) => x + 1);
  };
  const reopen = async (file: File) => {
    setError("");
    try {
      if (!loaded) throw Error("Wait for the source evidence.");
      if (file.size > 100000) throw Error("Investigation exceeds 100 KB.");
      const d = parseKrasInvestigation(await file.text(), loaded.hash);
      setPrediction(d.prediction);
      setRevealed(d.revealed);
      setScene(d.view.scene);
      setResidue(d.view.residue);
      setOverlay(d.view.overlay);
      setRestore(d.view.camera);
      setOrbit(false);
      setReset((x) => x + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const figure = async () => {
    setError("");
    try {
      if (
        !loaded ||
        document.querySelectorAll(
          ".kras-page .structure-stage[data-ready=true]",
        ).length !== 2
      )
        throw Error("Wait for both structures to finish rendering.");
      setOrbit(false);
      viewers.current.forEach((v) => v?.spin(false));
      await exportFigure(
        viewers.current.map((v) => v!.pngURI()),
        loaded.data.structures.map(
          (s) => `${s.state === "normal" ? "Normal" : "Mutant"} KRAS · ${s.id}`,
        ),
        [
          "KRAS G12D · HLA-A*11:01 · engineered JDIa41b1 receptor · both structures receptor-bound",
          scene === "contacts"
            ? "Dashed lines: closest peptide-P6/HLA Q70 or R114 heavy atoms; atom identities differ for R114. Distances are not energies."
            : `HLA A:2–276 alignment · 275 shared Cα · ${loaded.data.alignment.rmsd.toFixed(3)} Å RMSD · ${overlay ? "gray: normal reference" : "reference overlay off"}`,
          `Poole et al., 2022 · doi:10.1038/s41467-022-32811-1${revealed ? " · TCR KD: normal 3 μM; mutant 0.743 ± 0.018 nM (SD, n=2)" : ""}`,
        ],
        "",
        "mutiny-kras-comparison.png",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <main className="molecule-page kras-page">
      <section className="intro-bar molecular-intro">
        <div>
          <h1>Similar shapes. Different recognition?</h1>
          <p className="study-context">
            KRAS G12D · HLA-A*11:01 · engineered receptor JDIa41b1
          </p>
        </div>
        <a
          className="study-link"
          href="https://www.nature.com/articles/s41467-022-32811-1"
          target="_blank"
          rel="noreferrer"
        >
          Poole et al., 2022 <ArrowUpRight size={13} />
        </a>
      </section>
      <div className="pair-actions">
        <CuratedCases
          selected="kras"
          onSelect={(id) => {
            if (id === "hhat") onHhat(snapshot());
          }}
        />
        <FocusComparison
          caseId="kras"
          initialStep={scene === "peptide" ? 0 : scene === "contacts" ? 1 : 2}
          initialResidue={residue}
        />
        <button
          className="project-action"
          onClick={() => onOwnPair(snapshot())}
        >
          <FileUp size={15} /> Compare your pair
        </button>
        <InvestigationActions>
          <button
            className="project-action"
            disabled={!loaded}
            onClick={() => input.current?.click()}
          >
            Open investigation
          </button>
          <button
            className="project-action"
            disabled={!loaded}
            onClick={() =>
              downloadFile(
                JSON.stringify(snapshot(), null, 2),
                "mutiny-kras-investigation.json",
              )
            }
          >
            Save investigation
          </button>
          <button className="project-action" onClick={figure}>
            <ImageDown size={15} /> Save figure
          </button>
        </InvestigationActions>
      </div>
      <input
        className="file-input"
        type="file"
        accept=".json"
        ref={input}
        aria-label="Open KRAS investigation"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void reopen(f);
        }}
      />
      {(error || loadError) && (
        <p className="project-error" role="alert">
          {error || loadError}
        </p>
      )}
      {loaded && (
        <>
          <div className={`molecular-workspace ${expanded ? "expanded" : ""}`}>
            <div
              className="mechanism-path"
              aria-label="Explore KRAS recognition"
            >
              {steps.map((s) => (
                <button
                  key={s.id}
                  aria-pressed={scene === s.id}
                  className={scene === s.id ? "selected" : ""}
                  onClick={() => select(s.id)}
                >
                  <span>{s.title}</span>
                  <strong>{s.detail}</strong>
                </button>
              ))}
              <ExperimentJump onBeforeJump={() => setExpanded(false)} />
            </div>
            <aside className="molecular-rail">
              <button
                className={`project-action ${overlay ? "selected" : ""}`}
                aria-pressed={overlay}
                onClick={() => {
                  setRestore(viewers.current[0]?.getView() ?? null);
                  setOverlay(!overlay);
                }}
              >
                Overlay normal reference
              </button>
              <div className="view-tools">
                <button
                  className="icon-button"
                  aria-label={orbit ? "Pause rotation" : "Rotate automatically"}
                  onClick={() => setOrbit(!orbit)}
                >
                  {orbit ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  className="icon-button"
                  aria-label="Reset cameras"
                  onClick={() => select(scene, residue)}
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={expanded ? "Exit expanded view" : "Expand 3D"}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </aside>
            <section className="structure-comparison">
              <div className="viewer-pair">
                {loaded.data.structures.map((s, i) => (
                  <article key={s.id} className={`structure-card ${s.state}`}>
                    <div className="structure-title">
                      <h3>{i ? "Mutant" : "Normal"} peptide</h3>
                      <a
                        href={`https://www.rcsb.org/structure/${s.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.id}
                        <ArrowUpRight size={12} />
                      </a>
                    </div>
                    <Stage
                      index={i}
                      texts={loaded.texts}
                      data={loaded.data}
                      scene={scene}
                      residue={residue}
                      overlay={overlay}
                      reset={reset}
                      restore={restore}
                      orbit={orbit}
                      onViewer={register}
                      onPick={(n) => select("peptide", n)}
                    />
                    <div className="peptide-strip">
                      {s.peptide.split("").map((aa, j) => (
                        <button
                          key={j}
                          aria-label={`Inspect peptide position ${j + 1}, ${aa}`}
                          aria-pressed={residue === j + 1}
                          className={`${j === 5 ? "mutation" : ""} ${residue === j + 1 ? "active" : ""}`}
                          onClick={() => select("peptide", j + 1)}
                        >
                          <span>{aa}</span>
                          <small>{j + 1}</small>
                        </button>
                      ))}
                    </div>
                    <div className="structure-caption">
                      <span>RECEPTOR BOUND</span>
                      <span>HLA-A*11:01</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <div
              className="kras-differences"
              aria-label="Peptide backbone differences"
            >
              <div>
                <h2>How much did the backbone change?</h2>
                <span>HLA aligned · RMSD · 0–1 Å</span>
              </div>
              <div className="kras-bars">
                {loaded.data.differences.map((d) => (
                  <button
                    key={d.position}
                    aria-label={`Position ${d.position}: backbone RMSD ${d.backbone.value.toFixed(2)} angstrom`}
                    aria-pressed={residue === d.position}
                    onClick={() => select("peptide", d.position)}
                  >
                    <strong>{d.backbone.value.toFixed(2)}</strong>
                    <div>
                      <i style={{ height: `${d.backbone.value * 100}%` }} />
                    </div>
                    <span>
                      {d.position === 6 ? "G → D" : d.normal}
                      <small>{d.position}</small>
                    </span>
                  </button>
                ))}
              </div>
              <p>Backbone atoms only. Side-chain naming can mimic movement.</p>
            </div>
          </div>
          <section
            className={`prediction-strip ${revealed ? "revealed" : ""}`}
            tabIndex={-1}
            aria-label="Your KRAS binding prediction"
          >
            {!revealed ? (
              <>
                <div>
                  <h2>Which peptide binds this receptor more tightly?</h2>
                </div>
                <div className="prediction-options">
                  {predictions.map(([id, label]) => (
                    <button
                      key={id}
                      aria-pressed={prediction === id}
                      className={prediction === id ? "selected" : ""}
                      onClick={() => setPrediction(id)}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    className="reveal-experiment"
                    disabled={!prediction}
                    onClick={() => setRevealed(true)}
                  >
                    Reveal result
                  </button>
                </div>
                <button
                  className="skip-prediction"
                  onClick={() => setRevealed(true)}
                >
                  Skip to evidence
                </button>
              </>
            ) : (
              <>
                <div>
                  <h2>Over 4,000× tighter binding to the mutant.</h2>
                  <p>
                    {prediction === "cannot-infer"
                      ? "Right: shape alone could not tell us. "
                      : prediction
                        ? `Your prediction: ${predictions.find(([id]) => id === prediction)?.[1].toLowerCase()}. `
                        : ""}
                    The difference was measured by SPR.
                  </p>
                </div>
                <div className="binding-reveal">
                  <span>
                    Normal
                    <strong>
                      {Number(
                        (loaded.data.assay.normal.value * 1e9).toPrecision(6),
                      ).toLocaleString("en-US")}{" "}
                      nM
                    </strong>
                  </span>
                  <span>
                    Mutant
                    <strong>
                      {Number(
                        (loaded.data.assay.mutant.value * 1e9).toPrecision(6),
                      )}{" "}
                      nM
                    </strong>
                  </span>
                  <small>
                    Kᴅ · lower means tighter · mutant ±{" "}
                    {Number(
                      (
                        loaded.data.assay.mutant.standardDeviation * 1e9
                      ).toPrecision(6),
                    )}{" "}
                    nM (SD, n=2)
                  </small>
                </div>
              </>
            )}
          </section>
          <details className="kras-evidence">
            <summary>Evidence & structure quality</summary>
            <p>
              Same engineered receptor, both states bound. Normal 7OW5: 2.58 Å
              resolution; mutant 7OW6: 2.64 Å. All ten peptide residues are
              modeled. No experimental density map has been inspected here.
            </p>
            <p>
              {loaded.data.alignment.description} Mutant HLA A:1 is excluded
              because it is absent in the normal deposit. This curated mapping
              does not change the rules for uploaded pairs.
            </p>
            {scene === "contacts" && (
              <table>
                <caption>Closest heavy atoms · geometric distances</caption>
                <thead>
                  <tr>
                    <th>Peptide</th>
                    <th>P6 atom → HLA atom</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {loaded.data.contacts.map((c) => (
                    <tr key={`${c.pdb}/${c.hlaAtom.residue}`}>
                      <td>{c.pdb === "7OW5" ? "Normal" : "Mutant"}</td>
                      <td>
                        {c.peptideAtom.name} →{" "}
                        {c.hlaAtom.residue === 70 ? "Q70" : "R114"}{" "}
                        {c.hlaAtom.name}
                      </td>
                      <td>{c.distanceAngstrom.toFixed(2)} Å</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p>
              Binding: Table 2, JDIa41b1. Normal has no reported uncertainty;
              mutant uncertainty is SD, n=2. These are receptor–peptide/HLA
              affinities, not vaccine-response measurements. Static distances do
              not determine binding energies.
            </p>
            <p>
              Molecular Structure Viewer independently checked HLA alignment and
              mutant contacts. Biological Sequence & Alignment Viewer verified
              peptide sequences; Life Sciences Literature retrieved the primary
              paper.{" "}
              <a
                href="https://github.com/Supernova-45/mutiny/blob/main/rosalind/STRUCTURAL_RETURN.md"
                target="_blank"
                rel="noreferrer"
              >
                Rosalind execution record
              </a>{" "}
              ·{" "}
              <a href="/data/kras.json" download>
                Comparison data & source hashes
              </a>
            </p>
          </details>
        </>
      )}
      {!loaded && !loadError && (
        <div className="loading">Opening KRAS evidence…</div>
      )}
    </main>
  );
}
