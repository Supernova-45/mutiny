import { useEffect, useRef, useState } from "react";
import * as mol from "3dmol";
import {
  ArrowUpRight,
  BookOpen,
  CircleHelp,
  Download,
  FileUp,
  ImageDown,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import type { Structure, StructureData } from "../types";
import BindingExperiment, { type HhatEvidence } from "./BindingExperiment";
import { downloadFile, exportFigure, validView } from "../lib/investigation";
import PairWorkbench from "./PairWorkbench";
import CuratedCases from "./CuratedCases";
import KrasComparison from "./KrasComparison";
import type { KrasInvestigation } from "../lib/kras-investigation";
import {
  molecularStyle as stage,
  styleViewer,
  animateView,
  cameraBetween,
  reduceMotion,
} from "../lib/molecular-style";

const color = {
  hla: stage.hla,
  normal: stage.normal,
  mutant: stage.mutant,
  mutation: stage.mutation,
  tcr: stage.receptor,
};

// Fit the biological feature first; these factors leave room for its immediate context.
// Overview deliberately crops peripheral HLA, while close-ups preserve the W6/contact detail.
const framing = {
  peptide: 1.15,
  receptorOverview: 1,
  neighboringShape: 1.5,
  contact: 1.1,
};

function Viewer({
  structure,
  surface,
  residue,
  bound,
  onReady,
  onPick,
  resetKey,
  focus,
  ghost,
  evidence,
  restore,
}: {
  structure: Structure;
  surface: boolean;
  residue: number;
  bound: boolean;
  onReady: (v: mol.GLViewer) => void;
  onPick: (n: number) => void;
  resetKey: number;
  focus: boolean;
  ghost: boolean;
  evidence: HhatEvidence | null;
  restore: number[] | null;
}) {
  const div = useRef<HTMLDivElement>(null),
    viewer = useRef<mol.GLViewer | null>(null),
    camera = useRef<number[]>(null),
    lastReset = useRef(resetKey),
    initialView = useRef<number[]>(null);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const signature = `${structure.id}/${surface}/${residue}/${bound}/${resetKey}/${focus}/${ghost}`;
  const [renderedSignature, setRenderedSignature] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const ready = useRef(onReady),
    pick = useRef(onPick);
  ready.current = onReady;
  pick.current = onPick;
  useEffect(() => {
    if (!div.current) return;
    const element = div.current;
    try {
      const v = mol.createViewer(element, {
        backgroundColor: stage.background,
        antialias: true,
      });
      viewer.current = v;
      styleViewer(v);
      initialView.current = v.getView();
      ready.current(v);
      const resize = new ResizeObserver(() => {
        v.resize();
        v.render();
      });
      resize.observe(element);
      return () => {
        resize.disconnect();
        v.spin(false);
        v.clear();
        element.replaceChildren();
        viewer.current = null;
      };
    } catch {
      setError(
        "WebGL is unavailable. Enable hardware acceleration to explore the structures.",
      );
    }
  }, []);
  useEffect(() => {
    const v = viewer.current;
    if (!v) return;
    let cancelled = false,
      interrupted = false;
    const element = div.current;
    const interrupt = () => {
      interrupted = true;
    };
    element?.addEventListener("pointerdown", interrupt);
    setTransitioning(false);
    camera.current = v.getModel() ? v.getView() : null;
    setLoading(true);
    setError("");
    const load = (id: string) =>
      fetch(`/structures/${id}.pdb`).then((r) => {
        if (!r.ok) throw Error("Structure download failed");
        return r.text();
      });
    const ghostId = structure.state === "normal" ? "6UK2" : "6UK4";
    Promise.all([
      load(structure.id),
      ghost && !bound ? load(ghostId) : Promise.resolve(null),
    ])
      .then(async ([text, ghostText]) => {
        if (cancelled) return;
        v.clear();
        v.addModel(text, "pdb");
        v.setStyle({}, {});
        v.setStyle(
          { chain: "A", resi: Array.from({ length: 180 }, (_, i) => i + 1) },
          { cartoon: { color: color.hla, opacity: 0.78 } },
        );
        if (bound)
          for (const chain of ["D", "E"])
            v.setStyle(
              { chain, resi: Array.from({ length: 115 }, (_, i) => i + 1) },
              { cartoon: { color: color.tcr, opacity: 0.85 } },
            );
        const base = structure.state === "normal" ? color.normal : color.mutant;
        v.setStyle(
          { chain: "C" },
          {
            stick: { radius: 0.23, color: base },
            sphere: { scale: 0.22, color: base },
          },
        );
        v.setStyle(
          { chain: "C", resi: 8 },
          {
            stick: { radius: 0.3, color: color.mutation },
            sphere: { scale: 0.26, color: color.mutation },
          },
        );
        v.addStyle(
          { chain: "C", resi: residue },
          { stick: { radius: 0.34 }, sphere: { scale: 0.29 } },
        );
        if (focus) {
          v.setStyle(
            { chain: "A" },
            { cartoon: { color: color.hla, opacity: 0.22 } },
          );
          if (bound)
            for (const chain of ["D", "E"])
              v.setStyle(
                { chain },
                { cartoon: { color: color.tcr, opacity: 0.25 } },
              );
          v.addStyle(
            { chain: "C", resi: 6 },
            {
              stick: { radius: 0.27, color: stage.selected },
              sphere: { scale: 0.23, color: stage.selected },
            },
          );
          if (bound) {
            v.setStyle(
              { chain: "D", resi: 100 },
              {
                stick: { radius: 0.25, color: color.tcr },
                sphere: { scale: 0.22, color: color.tcr },
              },
            );
            const contact = evidence?.contacts.find(
              (c) => c.state === structure.id,
            );
            if (contact) {
              const xyz = (p: number[]) => ({ x: p[0], y: p[1], z: p[2] });
              v.addLine({
                start: xyz(contact.start),
                end: xyz(contact.end),
                color: stage.reference,
                dashed: true,
                linewidth: 2,
              });
              v.addLabel(`${contact.value.toFixed(2)} Å`, {
                position: xyz(
                  contact.start.map((v, i) => (v + contact.end[i]) / 2),
                ),
                fontColor: "#eef2f4",
                backgroundColor: stage.background,
                backgroundOpacity: 0.9,
                fontSize: 12,
                borderThickness: 0,
                inFront: true,
              });
            }
          }
        }
        const surfaces: Promise<unknown>[] = [];
        if (surface) {
          surfaces.push(
            v.addSurface(
              mol.SurfaceType.VDW,
              { opacity: 0.72, color: color.hla },
              {
                chain: "A",
                resi: Array.from({ length: 180 }, (_, i) => i + 1),
              },
            ),
          );
          surfaces.push(
            v.addSurface(
              mol.SurfaceType.VDW,
              { opacity: 0.62, color: base },
              { chain: "C", resi: [1, 2, 3, 4, 5, 6, 7, 9] },
            ),
          );
          surfaces.push(
            v.addSurface(
              mol.SurfaceType.VDW,
              { opacity: 0.85, color: color.mutation },
              { chain: "C", resi: 8 },
            ),
          );
        }
        await Promise.all(surfaces);
        if (cancelled) return;
        v.setClickable({ chain: "C" }, true, (atom: mol.AtomSpec) => {
          if (atom.resi) pick.current(atom.resi);
        });
        const entrance = Boolean(
          camera.current &&
            resetKey !== lastReset.current &&
            !restore &&
            !reduceMotion(),
        );
        let reference: mol.GLModel | null = null;
        const connectors: Parameters<mol.GLViewer["addLine"]>[0][] = [];
        if (ghostText) {
          reference = v.addModel(
            ghostText
              .split("\n")
              .filter(
                (l) =>
                  l.startsWith("ATOM") &&
                  l[21] === "C" &&
                  Number(l.slice(22, 26)) === 6,
              )
              .join("\n"),
            "pdb",
          );
          reference.setStyle(
            {},
            {
              stick: {
                radius: 0.09,
                color: stage.reference,
                opacity: entrance ? 0 : 0.8,
              },
            },
          );
          // Join corresponding deposited ring atoms; these are differences, not bonds or trajectories.
          const comparison = evidence?.comparisons.find(
            (c) => c.states[0] === structure.id && c.states[1] === ghostId,
          );
          for (const atom of comparison?.atoms ?? []) {
            const a = v
              .getModel(0)
              .selectedAtoms({ chain: "C", resi: 6, atom })[0];
            const b = reference.selectedAtoms({ atom })[0];
            if (a && b && [a.x, a.y, a.z, b.x, b.y, b.z].every(Number.isFinite))
              connectors.push({
                start: { x: a.x!, y: a.y!, z: a.z! },
                end: { x: b.x!, y: b.y!, z: b.z! },
                color: stage.connector,
                dashed: true,
                linewidth: 1,
              });
          }
        }
        if (camera.current && resetKey === lastReset.current)
          v.setView(camera.current);
        else {
          if (initialView.current) v.setView(initialView.current, true);
          if (bound) v.rotate(62, "x");
          if (focus) {
            if (bound) {
              v.zoomTo({
                model: 0,
                or: [
                  { chain: "C", resi: 6 },
                  { chain: "D", resi: 100 },
                ],
              });
              v.zoom(framing.contact);
            } else {
              v.zoomTo({ model: 0, chain: "C", resi: [6, 7, 8] });
              v.zoom(framing.neighboringShape);
            }
            v.rotate(20, "y");
          } else {
            v.zoomTo({ model: 0, chain: "C" });
            v.zoom(bound ? framing.receptorOverview : framing.peptide);
          }
          if (restore) v.setView(restore);
        }
        if (entrance) {
          setTransitioning(true);
          const target = v.getView(),
            from = camera.current!;
          v.setView(from);
          await animateView(
            420,
            (t) => v.setView(cameraBetween(from, target, t)),
            () => cancelled || interrupted,
          );
          if (cancelled) return;
          if (reference)
            await animateView(
              240,
              (t) => {
                reference!.setStyle(
                  {},
                  {
                    stick: {
                      radius: 0.09,
                      color: stage.reference,
                      opacity: 0.8 * t,
                    },
                  },
                );
                v.render();
              },
              () => cancelled,
            );
          if (cancelled) return;
        }
        for (const connector of connectors) v.addLine(connector);
        lastReset.current = resetKey;
        v.setSlab(-100, 100);
        v.render();
        setTransitioning(false);
        setRenderedSignature(signature);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      element?.removeEventListener("pointerdown", interrupt);
    };
  }, [
    structure.id,
    surface,
    residue,
    bound,
    resetKey,
    focus,
    ghost,
    evidence,
    restore,
  ]);
  return (
    <div
      className="structure-stage"
      aria-busy={loading || renderedSignature !== signature}
      data-ready={!loading && renderedSignature === signature && !error}
    >
      <div
        ref={div}
        className="molecule-canvas"
        aria-label={`Interactive ${structure.state} HHAT structure ${structure.id}`}
      />
      {(loading || renderedSignature !== signature) &&
        !transitioning &&
        !error && <div className="viewer-loading">Loading {structure.id}…</div>}
      {error && (
        <div className="viewer-error">
          {error}
          <a
            href={`https://www.rcsb.org/structure/${structure.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Open experimental structure
          </a>
        </div>
      )}
    </div>
  );
}

export default function Molecule({ onEvidence }: { onEvidence: () => void }) {
  const [data, setData] = useState<StructureData | null>(null),
    [error, setError] = useState("");
  const [bound, setBound] = useState(false),
    [surface, setSurface] = useState(false),
    [residue, setResidue] = useState(6),
    [resetKey, setResetKey] = useState(0);
  const [orbit, setOrbit] = useState(false),
    [expanded, setExpanded] = useState(false);
  const [mechanism, setMechanism] = useState<"mutation" | "shape" | "contact">(
    "shape",
  );
  const [experiment, setExperiment] = useState("original"),
    [evidence, setEvidence] = useState<HhatEvidence | null>(null),
    [evidenceError, setEvidenceError] = useState("");
  const [prediction, setPrediction] = useState<string | null>(null),
    [revealed, setRevealed] = useState(false),
    [note, setNote] = useState(""),
    [saveError, setSaveError] = useState(""),
    [restore, setRestore] = useState<number[] | null>(null);
  const investigationFile = useRef<HTMLInputElement>(null);
  const [ownPair, setOwnPair] = useState(false);
  const [selectedCase, setSelectedCase] = useState<"hhat" | "kras">(() =>
    new URLSearchParams(location.search).get("case") === "kras"
      ? "kras"
      : "hhat",
  );
  useEffect(() => {
    const url = new URL(location.href);
    if (selectedCase === "kras") url.searchParams.set("case", "kras");
    else url.searchParams.delete("case");
    history.replaceState(history.state, "", url);
  }, [selectedCase]);
  const [krasSession, setKrasSession] = useState<KrasInvestigation | null>(
    null,
  );
  const viewers = useRef<(mol.GLViewer | null)[]>([null, null]);
  useEffect(() => {
    fetch("/data/structures.json")
      .then((r) => {
        if (!r.ok) throw Error("Structure data unavailable");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    fetch("/data/hhat-evidence.json")
      .then((r) => {
        if (!r.ok) throw Error("Experimental measurements unavailable");
        return r.json();
      })
      .then(setEvidence)
      .catch((e) => setEvidenceError(e.message));
  }, []);
  useEffect(() => {
    const v = viewers.current[0];
    if (v) v.spin(orbit ? "vy" : false, 0.3, true);
    return () => {
      v?.spin(false);
    };
  }, [orbit]);
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
  const register = (i: number) => (v: mol.GLViewer) => {
    viewers.current[i] = v;
    if (viewers.current[0] && viewers.current[1]) {
      viewers.current[0].linkViewer(viewers.current[1]);
      viewers.current[1].linkViewer(viewers.current[0]);
    }
  };
  if (ownPair)
    return (
      <PairWorkbench
        onBack={() => setOwnPair(false)}
        backLabel={selectedCase === "kras" ? "KRAS example" : "HHAT example"}
      />
    );
  if (selectedCase === "kras")
    return (
      <KrasComparison
        initialSession={krasSession}
        onHhat={(session) => {
          setKrasSession(session);
          setSelectedCase("hhat");
        }}
        onOwnPair={(session) => {
          setKrasSession(session);
          setOwnPair(true);
        }}
      />
    );
  if (error) return <main className="loading">{error}</main>;
  if (!data)
    return <main className="loading">Opening molecular evidence…</main>;
  const structures = [
    data.structures.find((s) => s.state === "normal" && s.bound === bound)!,
    data.structures.find((s) => s.state === "mutant" && s.bound === bound)!,
  ];
  const chooseMechanism = (step: "mutation" | "shape" | "contact") => {
    setMechanism(step);
    setResidue(step === "mutation" ? 8 : 6);
    setBound(step === "contact");
    setSurface(step === "mutation");
    setOrbit(false);
    setRestore(null);
    setResetKey((k) => k + 1);
  };
  const sources = data.structures.map((s) => ({
    id: s.id,
    sha256: s.alignedSha256,
  }));
  const save = () =>
    downloadFile(
      JSON.stringify(
        {
          kind: "mutiny-hhat-investigation",
          version: 1,
          sources,
          evidenceSources: evidence?.provenance.inputs ?? [],
          prediction,
          revealed,
          note,
          view: {
            mechanism,
            bound,
            surface,
            residue,
            experiment,
            camera: viewers.current[0]?.getView() ?? null,
          },
        },
        null,
        2,
      ),
      "mutiny-hhat-investigation.json",
    );
  const reopen = async (file: File) => {
    setSaveError("");
    try {
      if (file.size > 100000) throw Error("HHAT investigation exceeds 100 KB.");
      const saved = JSON.parse(await file.text()),
        v = saved.view;
      if (saved.kind !== "mutiny-hhat-investigation" || saved.version !== 1)
        throw Error(
          "Open a saved HHAT investigation. For your own structures, choose Compare your pair.",
        );
      if (
        JSON.stringify(saved.sources) !== JSON.stringify(sources) ||
        JSON.stringify(saved.evidenceSources) !==
          JSON.stringify(evidence?.provenance.inputs ?? [])
      )
        throw Error(
          "The saved source versions differ from this build. Reconcile the evidence before reopening.",
        );
      if (
        !v ||
        !["mutation", "shape", "contact"].includes(v.mechanism) ||
        typeof v.bound !== "boolean" ||
        typeof v.surface !== "boolean" ||
        !Number.isInteger(v.residue) ||
        v.residue < 1 ||
        v.residue > 9 ||
        !["original", "analogue", "alanine", "position8"].includes(
          v.experiment,
        ) ||
        !["normal", "mutant", "similar", null].includes(saved.prediction) ||
        typeof saved.revealed !== "boolean" ||
        typeof saved.note !== "string" ||
        saved.note.length > 2000 ||
        (v.camera !== null && !validView(v.camera))
      )
        throw Error("Invalid investigation or molecular view.");
      if (v.bound !== (v.mechanism === "contact"))
        throw Error("The saved structural state is inconsistent.");
      setPrediction(saved.prediction);
      setRevealed(saved.revealed);
      setNote(saved.note);
      setMechanism(v.mechanism);
      setBound(v.bound);
      setSurface(v.surface);
      setResidue(v.residue);
      setExperiment(v.experiment);
      setRestore(v.camera);
      setOrbit(false);
      setResetKey((k) => k + 1);
    } catch (e) {
      setSaveError((e as Error).message);
    }
  };
  const figure = async () => {
    setSaveError("");
    try {
      if (
        document.querySelectorAll(".structure-stage[data-ready=true]")
          .length !== 2
      )
        throw Error("Wait for both structures to finish rendering.");
      setOrbit(false);
      viewers.current.forEach((v) => v?.spin(false));
      const ring = (id: string) =>
        evidence?.comparisons
          .find((c) => c.states[0] === id)
          ?.rmsd.toFixed(2) ?? "unavailable";
      const contact = (id: string) =>
        evidence?.contacts.find((c) => c.state === id)?.value.toFixed(2) ??
        "unavailable";
      await exportFigure(
        viewers.current.map((v) => v!.pngURI()),
        structures.map(
          (s) => `${s.state === "normal" ? "Normal" : "Mutant"} HHAT · ${s.id}`,
        ),
        [
          `HHAT L75F · HLA-A*02:06 · ${bound ? "302TIL receptor-bound" : "peptide–HLA, unbound"} · selected peptide position ${residue}`,
          mechanism === "shape"
            ? `Gray: receptor-bound W6; dashed lines join matching atoms. HLA-fixed W6 ring RMSD: normal ${ring("6UJQ")} Å; mutant ${ring("6UJO")} Å.`
            : mechanism === "contact"
              ? `W6 NE1 → Tyr100α ring centroid: normal ${contact("6UK2")} Å; mutant ${contact("6UK4")} Å. Static crystal geometry.`
              : "Orange: mutation at peptide position 8. Structures aligned on HLA platform Cα atoms.",
          `Devlin et al., 2020 · doi:10.1038/s41589-020-0610-1${prediction ? ` · Your binding prediction: ${prediction}` : ""}`,
        ],
        note,
        "mutiny-hhat-comparison.png",
      );
    } catch (e) {
      setSaveError((e as Error).message);
    }
  };
  return (
    <main className="molecule-page">
      <CuratedCases
        selected="hhat"
        onSelect={(id) => {
          if (id === "kras") {
            setRestore(viewers.current[0]?.getView() ?? null);
            setOrbit(false);
            setExpanded(false);
            viewers.current = [null, null];
            setSelectedCase(id);
          }
        }}
      />
      <section className="intro-bar molecular-intro">
        <div>
          <h1>What changes beyond a cancer mutation?</h1>
          <p className="study-context">Ovarian cancer · HHAT L75F</p>
        </div>
        <a
          className="study-link"
          href="https://www.nature.com/articles/s41589-020-0610-1"
          target="_blank"
          rel="noreferrer"
        >
          Devlin et al., 2020 <ArrowUpRight size={13} />
        </a>
      </section>
      <div className="pair-actions">
        <button
          className="project-action"
          onClick={() => {
            setOrbit(false);
            setOwnPair(true);
          }}
        >
          <FileUp size={15} /> Compare your pair
        </button>
        <div>
          <button
            className="project-action"
            onClick={() => investigationFile.current?.click()}
          >
            Open investigation
          </button>
          <button
            className="project-action"
            disabled={!evidence}
            onClick={save}
          >
            <Download size={15} /> Save investigation
          </button>
          <button className="project-action" onClick={figure}>
            <ImageDown size={15} /> Save figure
          </button>
        </div>
      </div>
      <input
        className="file-input"
        ref={investigationFile}
        type="file"
        accept=".json"
        aria-label="Open HHAT investigation"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void reopen(f);
        }}
      />
      {saveError && (
        <p className="project-error" role="alert">
          {saveError}
        </p>
      )}
      <section
        className={`prediction-strip ${revealed ? "revealed" : ""}`}
        aria-label="Your binding prediction"
      >
        {!revealed ? (
          <>
            <div>
              <h2>Which peptide binds the T-cell receptor more tightly?</h2>
              <p>Make a prediction, then reveal the experiment.</p>
            </div>
            <div className="prediction-options">
              {(["normal", "mutant", "similar"] as const).map((value) => (
                <button
                  key={value}
                  className={prediction === value ? "selected" : ""}
                  aria-pressed={prediction === value}
                  onClick={() => setPrediction(value)}
                >
                  {value === "normal"
                    ? "Normal"
                    : value === "mutant"
                      ? "Mutant"
                      : "Similar"}
                </button>
              ))}
              <button
                className="reveal-experiment"
                disabled={!prediction || !evidence}
                onClick={() => setRevealed(true)}
              >
                Reveal result
              </button>
            </div>
            <button
              className="skip-prediction"
              disabled={!evidence}
              onClick={() => setRevealed(true)}
            >
              Skip to evidence
            </button>
          </>
        ) : (
          <>
            <div>
              <h2>The mutant bound more tightly.</h2>
              <p>
                {prediction
                  ? `Your prediction: ${prediction === "similar" ? "similar binding" : prediction}. `
                  : ""}
                The measured structures help explain why.
              </p>
            </div>
            <div className="binding-reveal">
              <span>
                Normal{" "}
                <strong>
                  {evidence?.experiments.find((r) => r.id === "normal")?.value}{" "}
                  μM
                </strong>
              </span>
              <span>
                Mutant{" "}
                <strong>
                  {evidence?.experiments.find((r) => r.id === "mutant")?.value}{" "}
                  μM
                </strong>
              </span>
              <small>Kᴅ · lower means tighter binding</small>
            </div>
          </>
        )}
      </section>
      <div className={`molecular-workspace ${expanded ? "expanded" : ""}`}>
        <div
          className="mechanism-path"
          aria-label="Inspect the recognition mechanism"
        >
          {(
            [
              { id: "mutation", title: "The mutation", detail: "L8 → F8" },
              { id: "shape", title: "The neighboring shape", detail: "W6" },
              {
                id: "contact",
                title: "The receptor contact",
                detail: "W6 · Tyr100α",
              },
            ] as const
          ).map((step, i) => (
            <button
              key={step.id}
              className={mechanism === step.id ? "selected" : ""}
              aria-pressed={mechanism === step.id}
              onClick={() => chooseMechanism(step.id)}
            >
              <span>{step.title}</span>
              <strong>{step.detail}</strong>
              {i < 2 && (
                <span className="path-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </button>
          ))}
        </div>
        <aside className="molecular-rail">
          <div className="segmented">
            <button
              className={surface ? "selected" : ""}
              onClick={() => setSurface(true)}
            >
              Surface
            </button>
            <button
              className={!surface ? "selected" : ""}
              onClick={() => setSurface(false)}
            >
              Atoms
            </button>
          </div>
          <button
            className={`receptor-toggle ${bound ? "selected" : ""}`}
            aria-pressed={bound}
            onClick={() => chooseMechanism(bound ? "shape" : "contact")}
          >
            <span className="toggle-track">
              <i />
            </span>
            <span>302TIL receptor</span>
          </button>
          <div className="molecule-legend">
            <span>
              <i style={{ background: color.hla }} />
              HLA platform
            </span>
            <span>
              <i style={{ background: color.normal }} />
              Peptide
            </span>
            <span>
              <i style={{ background: color.mutation }} />
              Position 8
            </span>
            {mechanism !== "mutation" && (
              <span>
                <i style={{ background: "#497775" }} />
                W6
              </span>
            )}
            {bound && (
              <span>
                <i style={{ background: color.tcr }} />
                T-cell receptor
              </span>
            )}
          </div>
          <div className="camera-controls">
            <button
              className="icon-button"
              title={orbit ? "Pause rotation" : "Rotate automatically"}
              aria-label={orbit ? "Pause rotation" : "Rotate automatically"}
              aria-pressed={orbit}
              onClick={() => setOrbit(!orbit)}
            >
              {orbit ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              className="icon-button"
              title="Reset cameras"
              aria-label="Reset cameras"
              onClick={() => {
                setOrbit(false);
                setRestore(null);
                setResetKey((k) => k + 1);
              }}
            >
              <RotateCcw size={16} />
            </button>
            <button
              className="icon-button"
              title={expanded ? "Exit expanded view" : "Expand 3D"}
              aria-label={expanded ? "Exit expanded view" : "Expand 3D"}
              aria-pressed={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </aside>
        <section className="structure-comparison">
          <div className="viewer-pair">
            {structures.map((s, i) => (
              <article className={`structure-card ${s.state}`} key={s.state}>
                <div className="structure-title">
                  <h3>{i === 0 ? "Normal peptide" : "Mutant peptide"}</h3>
                  <a
                    href={`https://www.rcsb.org/structure/${s.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {s.id}
                    <ArrowUpRight size={12} />
                  </a>
                </div>
                <Viewer
                  structure={s}
                  surface={surface}
                  residue={residue}
                  bound={bound}
                  resetKey={resetKey}
                  onReady={register(i)}
                  onPick={setResidue}
                  focus={mechanism !== "mutation"}
                  ghost={mechanism === "shape"}
                  evidence={evidence}
                  restore={restore}
                />
                <div className="peptide-strip">
                  {s.peptide.split("").map((aa, j) => (
                    <button
                      key={j}
                      aria-label={`Inspect peptide position ${j + 1}, ${aa}`}
                      aria-pressed={residue === j + 1}
                      onClick={() => setResidue(j + 1)}
                      className={`${j === 7 ? "mutation" : ""} ${residue === j + 1 ? "active" : ""}`}
                    >
                      <span>{aa}</span>
                      <small>{j + 1}</small>
                    </button>
                  ))}
                </div>
                <div className="structure-caption">
                  <span>{s.bound ? "RECEPTOR BOUND" : "PEPTIDE–HLA"}</span>
                  <span>HLA-A*02:06</span>
                </div>
              </article>
            ))}
          </div>
          {mechanism === "shape" && evidence && (
            <section
              key={resetKey}
              className="geometry-strip pose-comparison"
              aria-label="W6 ring pose differences"
            >
              <div className="pose-heading">
                <h2>Same residue. Different poses.</h2>
                <span>Unbound / receptor-bound · HLA-aligned</span>
              </div>
              <div className="pose-measurements">
                {structures.map((s) => {
                  const other = s.state === "normal" ? "6UK2" : "6UK4";
                  const comparison = evidence.comparisons.find(
                    (c) => c.states[0] === s.id && c.states[1] === other,
                  );
                  return (
                    <div className={`pose-measure ${s.state}`} key={s.id}>
                      <div className="pose-reading">
                        <span>
                          {s.state === "normal" ? "Normal" : "Mutant"}
                        </span>
                        <strong>
                          {comparison?.rmsd.toFixed(2) ?? "—"} <small>Å</small>
                        </strong>
                      </div>
                      <div
                        className="pose-track"
                        role="img"
                        aria-label={`${s.state} W6 ring RMSD: ${comparison?.rmsd.toFixed(2) ?? "unavailable"} angstroms on a shared 0 to 4 angstrom scale`}
                      >
                        {comparison && (
                          <i
                            style={{ width: `${(100 * comparison.rmsd) / 4}%` }}
                          />
                        )}
                      </div>
                      <div className="pose-axis">
                        <span>0</span>
                        <span>W6 ring RMSD</span>
                        <span>4 Å</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pose-key">
                <span>
                  <i />
                  Gray: receptor-bound W6
                </span>
                <span>Dashed lines join matching atoms</span>
              </div>
            </section>
          )}
          {mechanism === "contact" && (
            <div className="geometry-strip">
              <span>Distance: W6 nitrogen → Tyr100α ring center</span>
              <span>Static crystal geometry</span>
            </div>
          )}
          <div className="residue-inspector">
            <div className="residue-heading">
              <span className="eyebrow">POSITION</span>
              <strong>{String(residue).padStart(2, "0")}</strong>
              <span>
                {residue === 8
                  ? "Mutation"
                  : residue === 6
                    ? "Tryptophan"
                    : "Residue"}
              </span>
            </div>
            <div className="residue-values">
              {structures.map((s) => {
                const r = s.residues.find((r) => r.position === residue)!;
                return (
                  <div key={s.id}>
                    <span>
                      {s.state === "normal" ? "NORMAL" : "MUTANT"} · {r.name}
                      {residue}
                    </span>
                    <strong>
                      {r.sasa.toFixed(1)} <small>Å²</small>
                    </strong>
                    <p>Accessible area</p>
                    {bound && (
                      <div className="contact-list">
                        <span>{r.contacts.length} contacts ≤ 4 Å</span>
                        {r.contacts.slice(0, 3).map((c) => (
                          <small key={c.residue}>
                            {c.residue} <b>{c.distance.toFixed(2)} Å</b>
                          </small>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="text-button" onClick={onEvidence}>
              <CircleHelp size={14} /> Methods
            </button>
          </div>
        </section>
      </div>
      {evidence && revealed && (
        <BindingExperiment
          data={evidence}
          group={experiment}
          onSelect={(group) => {
            setExperiment(group);
            if (group === "original" || group === "position8")
              chooseMechanism("mutation");
            else chooseMechanism("contact");
          }}
        />
      )}
      {evidenceError && (
        <p className="evidence-load-error" role="status">
          {evidenceError}.{" "}
          <a href="https://github.com/Supernova-45/mutiny/blob/main/rosalind/evidence.json">
            View source records
          </a>
        </p>
      )}
      <footer className="page-footer">
        <span>DEVLIN ET AL. / NATURE CHEMICAL BIOLOGY 2020</span>
        <span>X-ray structures</span>
        <button onClick={onEvidence}>
          Evidence <BookOpen size={14} />
        </button>
      </footer>
    </main>
  );
}
