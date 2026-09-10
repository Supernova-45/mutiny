import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as mol from "3dmol";
import {
  Check,
  Focus,
  ImageDown,
  Layers2,
  Link,
  Orbit,
  Pause,
  RotateCcw,
  Scan,
  X,
} from "lucide-react";
import { downloadFile, hashText } from "../lib/investigation";
import {
  animateView,
  cameraBetween,
  molecularStyle as colors,
  styleViewer,
} from "../lib/molecular-style";
import {
  focusLink,
  parseFocusLink,
  type FocusView,
} from "../lib/focus-link.mjs";
import "../focus.css";

type CaseId = "hhat" | "kras";
type Mode = FocusView["mode"];
interface Source {
  id: string;
  path: string;
  alignedSha256: string;
  peptide: string;
}
interface DensitySource {
  id: string;
  path: string;
  sha256: string;
  displaySha256: string;
  origin: number[];
  size: number[];
  spacing: number;
}
interface Loaded {
  sources: Source[];
  texts: string[];
  maps: DensitySource[];
  digest: string;
}
const steps = {
  hhat: ["The mutation", "The neighbor", "The receptor"],
  kras: ["The mutation", "The HLA groove", "The receptor"],
};
const xyz = (a: number[]) => ({ x: a[0], y: a[1], z: a[2] });
const normalColor = "#88bce7",
  mutantColor = "#f0a775";
const shortCase = (c: CaseId) => (c === "hhat" ? "HHAT L75F" : "KRAS G12D");

async function digestBytes(bytes: ArrayBuffer) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
async function getSources(caseId: CaseId): Promise<Loaded> {
  const r = await fetch(
    caseId === "hhat" ? "/data/structures.json" : "/data/kras.json",
  );
  if (!r.ok) throw Error("The source structures could not be loaded.");
  const data = await r.json();
  const sources: Source[] = data.structures.map((s: Source) => ({
    ...s,
    path: s.path ?? `/structures/${s.id}.pdb`,
  }));
  const texts = await Promise.all(
    sources.map(async (s) => {
      const response = await fetch(s.path);
      if (!response.ok) throw Error(`Could not load ${s.id}.`);
      const text = await response.text();
      if ((await hashText(text)) !== s.alignedSha256)
        throw Error(`Source check failed for ${s.id}.`);
      return text;
    }),
  );
  let maps: DensitySource[] = [];
  if (caseId === "hhat") {
    const response = await fetch("/density/manifest.json");
    if (!response.ok) throw Error("Density metadata could not be loaded.");
    maps = (await response.json()).sources;
  }
  return {
    sources,
    texts,
    maps,
    digest: await hashText(
      JSON.stringify({
        coordinates: sources.map((s) => [s.id, s.alignedSha256]),
        maps: maps.map((s) => [
          s.id,
          s.sha256,
          s.displaySha256,
          s.origin,
          s.size,
          s.spacing,
        ]),
      }),
    ),
  };
}

function FocusDialog({
  caseId,
  initialStep,
  initialResidue,
  onClose,
}: {
  caseId: CaseId;
  initialStep: number;
  initialResidue: number;
  onClose: () => void;
}) {
  const [incoming] = useState(() => {
    try {
      return { view: parseFocusLink(location.hash), error: "" };
    } catch (e) {
      return { view: null, error: (e as Error).message };
    }
  });
  const shared = incoming.view;
  const [step, setStep] = useState(shared?.step ?? initialStep);
  const [residue, setResidue] = useState(shared?.residue ?? initialResidue);
  const [mode, setMode] = useState<Mode>(shared?.mode ?? "both");
  const [context, setContext] = useState(shared?.context ?? false);
  const [orbit, setOrbit] = useState(false);
  const [density, setDensity] = useState(shared?.density ?? false);
  const [contour, setContour] = useState(shared?.contour ?? 1);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState(incoming.error);
  const [ready, setReady] = useState(false);
  const [densityStatus, setDensityStatus] = useState<
    "off" | "loading" | "ready" | "error"
  >("off");
  const [densityError, setDensityError] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const [reset, setReset] = useState(0);
  const root = useRef<HTMLDialogElement>(null),
    div = useRef<HTMLDivElement>(null);
  const viewer = useRef<mol.GLViewer | null>(null),
    cameraHome = useRef<number[] | null>(null);
  const volumes = useRef(new Map<string, mol.VolumeData>());
  const meshes = useRef<mol.GLShape[]>([]);
  const fitted = useRef(false),
    priorFocus = useRef("");
  const bound = caseId === "kras" || step === 2;
  const ids =
    caseId === "kras"
      ? ["7OW5", "7OW6"]
      : bound
        ? ["6UK2", "6UK4"]
        : ["6UJQ", "6UJO"];
  const sourceIndices = ids.map(
    (id) => loaded?.sources.findIndex((s) => s.id === id) ?? -1,
  );
  const focusKey = `${step}/${residue}/${reset}/${context}`;
  const drawKey = `${focusKey}/${mode}`;
  const [drawn, setDrawn] = useState("");

  useEffect(() => {
    const dialog = root.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (incoming.error) return;
    getSources(caseId)
      .then((data) => {
        if (
          shared &&
          (shared.caseId !== caseId || shared.sources !== data.digest)
        )
          throw Error(
            "This shared view uses different source evidence. Close it to explore the current examples.",
          );
        if (!cancelled) setLoaded(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, incoming, shared]);

  useEffect(() => {
    if (!div.current || !loaded) return;
    const el = div.current;
    let v: mol.GLViewer;
    try {
      v = mol.createViewer(el, { backgroundColor: "#172128", antialias: true });
      viewer.current = v;
      styleViewer(v, { outline: false });
      cameraHome.current = v.getView();
      loaded.texts.forEach((text) => {
        const model = v.addModel(text, "pdb");
        model.setStyle({}, {});
      });
      v.setClickable({ chain: "C" }, true, (a: mol.AtomSpec) => {
        if (a.resi) {
          setResidue(a.resi);
          setContext(false);
        }
      });
      const observer = new ResizeObserver(() => {
        v.resize();
        v.render();
      });
      observer.observe(el);
      setReady(true);
      return () => {
        observer.disconnect();
        v.spin(false);
        v.clear();
        el.replaceChildren();
        viewer.current = null;
      };
    } catch (e) {
      setError((e as Error).message);
    }
  }, [loaded]);

  // An explicit camera orbit, never motion of the atomic coordinates. Touch/drag
  // takes over immediately; changing the scientific view also stops the orbit.
  useEffect(() => {
    const v = viewer.current;
    const el = div.current;
    if (!v || !ready) return;
    if (orbit) v.spin("y", 0.22);
    else v.spin(false);
    const stop = () => setOrbit(false);
    const hidden = () => {
      if (document.hidden) stop();
    };
    el?.addEventListener("pointerdown", stop);
    el?.addEventListener("wheel", stop, { passive: true });
    document.addEventListener("visibilitychange", hidden);
    return () => {
      v.spin(false);
      el?.removeEventListener("pointerdown", stop);
      el?.removeEventListener("wheel", stop);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [orbit, ready]);

  useEffect(() => {
    setOrbit(false);
  }, [focusKey, mode, density, contour]);

  useEffect(() => {
    const v = viewer.current;
    if (!v || !ready || !loaded) return;
    let cancelled = false,
      interrupted = false;
    const el = div.current;
    const interrupt = () => {
      interrupted = true;
    };
    el?.addEventListener("pointerdown", interrupt);
    const draw = async () => {
      try {
        const previous = v.getView();
        v.setStyle({}, {});
        v.removeAllLabels();
        // Context belongs to the displayed structure; the normal context is used for the overlay.
        const contextIndex = sourceIndices[mode === "mutant" ? 1 : 0];
        v.setStyle(
          {
            model: contextIndex,
            chain: "A",
            resi: Array.from({ length: 180 }, (_, i) => i + 1),
          },
          {
            cartoon: {
              color: colors.hla,
              opacity: context ? 0.7 : step === 0 ? 0.25 : 0.13,
            },
          },
        );
        if (step === 2) {
          for (const chain of ["D", "E"])
            v.setStyle(
              {
                model: contextIndex,
                chain,
                resi: Array.from({ length: 115 }, (_, i) => i + 1),
              },
              {
                cartoon: {
                  color: colors.receptor,
                  opacity: context ? 0.85 : 0.25,
                },
              },
            );
          if (caseId === "hhat")
            v.setStyle(
              { model: contextIndex, chain: "D", resi: 100 },
              {
                stick: { color: colors.receptor, radius: 0.2 },
                sphere: { color: colors.receptor, scale: 0.2 },
              },
            );
        }
        if (step === 1 && caseId === "kras") {
          v.setStyle(
            { model: contextIndex, chain: "A", resi: [70, 114] },
            {
              stick: { color: colors.hla, radius: 0.19 },
              sphere: { color: colors.hla, scale: 0.19 },
            },
          );
          for (const [n, name] of [
            [70, "Q70"],
            [114, "R114"],
          ] as const) {
            const atom = v.selectedAtoms({
              model: contextIndex,
              chain: "A",
              resi: n,
              atom: "CA",
            })[0];
            if (atom)
              v.addLabel(name, {
                position: { x: atom.x!, y: atom.y!, z: atom.z! },
                fontSize: 12,
                fontColor: "#c4d1d8",
                backgroundColor: "#172128",
                backgroundOpacity: 0.8,
                borderThickness: 0,
                inFront: true,
              });
          }
        }
        sourceIndices.forEach((index, i) => {
          if ((mode === "normal" && i === 1) || (mode === "mutant" && i === 0))
            return;
          const color = i === 0 ? normalColor : mutantColor;
          v.setStyle(
            { model: index, chain: "C" },
            { stick: { color, radius: mode === "both" ? 0.12 : 0.18 } },
          );
          v.setStyle(
            { model: index, chain: "C", resi: residue },
            {
              stick: { color, radius: 0.25 },
              sphere: { color, scale: 0.23 },
            },
          );
          if (step === 1 && caseId === "hhat" && residue !== 8)
            v.setStyle(
              { model: index, chain: "C", resi: 8 },
              { stick: { color, radius: 0.2 } },
            );
        });
        if (focusKey !== priorFocus.current) {
          if (cameraHome.current) v.setView(cameraHome.current, true);
          if (step === 2) v.rotate(caseId === "hhat" ? 62 : 40, "x");
          const indices = sourceIndices;
          if (context) {
            v.zoomTo({
              model: contextIndex,
              or: [
                {
                  chain: "A",
                  resi: Array.from({ length: 180 }, (_, i) => i + 1),
                },
                { chain: "C" },
                ...(step === 2
                  ? ["D", "E"].map((chain) => ({
                      chain,
                      resi: Array.from({ length: 115 }, (_, i) => i + 1),
                    }))
                  : []),
              ],
            });
          } else if (step === 0) v.zoomTo({ model: indices, chain: "C" });
          else if (caseId === "hhat" && step === 2)
            v.zoomTo({
              model: indices,
              or: [
                { chain: "C", resi: residue },
                { chain: "D", resi: 100 },
              ],
            });
          else if (caseId === "kras" && step === 1)
            v.zoomTo({
              model: indices,
              or: [
                { chain: "C", resi: residue },
                { chain: "A", resi: [70, 114] },
              ],
            });
          else
            v.zoomTo({
              model: indices,
              chain: "C",
              resi:
                caseId === "hhat"
                  ? [residue, 7, 8]
                  : [residue - 1, residue, residue + 1],
            });
          v.rotate(18, "y");
          v.zoom(
            context
              ? el && el.clientWidth < 600
                ? 1.85
                : 0.95
              : step === 0
                ? 1.05
                : el && el.clientWidth < 600
                  ? 1.75
                  : 1.15,
          );
          if (!fitted.current && shared?.camera) v.setView(shared.camera);
          const target = v.getView();
          if (fitted.current) {
            v.setView(previous);
            await animateView(
              context ? 800 : 550,
              (t) => v.setView(cameraBetween(previous, target, t)),
              () => cancelled || interrupted,
            );
          }
          if (cancelled) return;
          fitted.current = true;
          priorFocus.current = focusKey;
        } else v.setView(previous);
        v.setSlab(-100, 100);
        v.render();
        setDrawn(drawKey);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    void draw();
    return () => {
      cancelled = true;
      el?.removeEventListener("pointerdown", interrupt);
    };
  }, [
    ready,
    loaded,
    caseId,
    step,
    residue,
    mode,
    reset,
    context,
    drawKey,
    focusKey,
  ]);

  useEffect(() => {
    const v = viewer.current;
    if (!v || !loaded || !ready) return;
    let cancelled = false;
    meshes.current.forEach((s) => v.removeShape(s));
    meshes.current = [];
    v.render();
    setDensityError("");
    if (!density || mode === "both" || caseId !== "hhat") {
      setDensityStatus("off");
      return;
    }
    setDensityStatus("loading");
    const id = ids[mode === "normal" ? 0 : 1];
    const draw = async () => {
      let volume = volumes.current.get(id);
      if (!volume) {
        const source = loaded.maps.find((s) => s.id === id);
        if (
          !source ||
          source.displaySha256 !==
            loaded.sources.find((s) => s.id === id)?.alignedSha256
        )
          throw Error(
            "The density and structure coordinate versions do not match.",
          );
        const response = await fetch(source.path);
        if (!response.ok)
          throw Error("The experimental density could not be loaded.");
        const bytes = await response.arrayBuffer();
        if ((await digestBytes(bytes)) !== source.sha256)
          throw Error("Density source check failed.");
        const decoded = await new Response(
          new Blob([bytes])
            .stream()
            .pipeThrough(new DecompressionStream("gzip")),
        ).arrayBuffer();
        if (decoded.byteLength !== source.size.reduce((a, b) => a * b, 1) * 4)
          throw Error("Invalid density grid.");
        volume = new mol.VolumeData("", "");
        const dataView = new DataView(decoded);
        volume.data = Float32Array.from(
          { length: decoded.byteLength / 4 },
          (_, i) => dataView.getFloat32(i * 4, true),
        );
        volume.origin = xyz(source.origin);
        volume.size = xyz(source.size);
        volume.unit = {
          x: source.spacing,
          y: source.spacing,
          z: source.spacing,
        };
        volumes.current.set(id, volume);
      }
      if (cancelled) return;
      const index = loaded.sources.findIndex((s) => s.id === id);
      const coords = v.selectedAtoms({
        model: index,
        chain: "C",
        resi: residue,
      });
      const mesh = v.addIsosurface(volume, {
        isoval: contour,
        color: mode === "normal" ? normalColor : mutantColor,
        wireframe: true,
        opacity: 0.48,
        coords: coords as mol.XYZ[],
        seldist: 2,
        smoothness: 0,
      });
      meshes.current = [mesh];
      v.render();
      setDensityStatus("ready");
    };
    void draw().catch((e) => {
      if (!cancelled) {
        setDensityError(e.message);
        setDensityStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [density, contour, mode, step, residue, loaded, ready, caseId]);

  const selectStep = (i: number) => {
    setStep(i);
    setResidue(i === 0 ? (caseId === "hhat" ? 8 : 6) : 6);
  };
  const snapshot = (): FocusView => ({
    version: 1,
    caseId,
    step,
    residue,
    mode,
    context,
    density,
    contour,
    sources: loaded!.digest,
    camera: viewer.current?.getView() ?? null,
  });
  const share = async () => {
    setOrbit(false);
    const url = focusLink(location.href, snapshot());
    history.replaceState(history.state, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setShareFallback(url);
    }
  };
  const saveImage = async () => {
    setOrbit(false);
    try {
      // Copy WebGL pixels directly; avoid an unnecessary PNG encode/decode before export.
      const image = viewer.current!.getCanvas();
      const canvas = document.createElement("canvas");
      const captionScale = Math.max(1, image.width / 1400);
      canvas.width = image.width;
      canvas.height = image.height + 98 * captionScale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#172128";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      ctx.translate(0, image.height);
      ctx.scale(captionScale, captionScale);
      ctx.fillStyle = "#e5e9e9";
      ctx.font = "18px sans-serif";
      ctx.fillText(
        `mutiny · ${shortCase(caseId)} · ${mode === "both" ? "Normal + mutant" : mode} · ${context ? "molecular context" : `peptide position ${residue}`}`,
        24,
        30,
        image.width / captionScale - 48,
      );
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#afbdc5";
      ctx.fillText(
        `${ids.join(" / ")} · ${caseId === "hhat" ? "HLA-A*02:06 platform alignment" : "HLA-A*11:01 · JDIa41b1 · shared-HLA alignment"} · ${bound ? "receptor-bound structures" : "unbound peptide–HLA"}`,
        24,
        54,
        image.width / captionScale - 48,
      );
      ctx.fillText(
        density
          ? `PDBe 2Fo-Fc · ${contour.toFixed(1)} σ (full unit cell) · local resampling · model-phased experimental support`
          : "Static deposited structures; no molecular interpolation. Blue: normal. Orange: mutant.",
        24,
        76,
        image.width / captionScale - 48,
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw Error("The figure could not be saved.");
      downloadFile(blob, `mutiny-${caseId}-superposition.png`, "image/png");
    } catch (e) {
      setDensityError((e as Error).message);
    }
  };
  const busy =
    !ready || drawn !== drawKey || (density && densityStatus === "loading");
  const selectedIsStoryResidue =
    residue === (step === 0 ? (caseId === "hhat" ? 8 : 6) : 6);
  const peptide =
    loaded?.sources.find((s) => s.id === ids[mode === "normal" ? 0 : 1])
      ?.peptide ?? "";
  return createPortal(
    <dialog
      className="focus-dialog"
      ref={root}
      aria-label={`${shortCase(caseId)} superimposed comparison`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="focus-header">
        <span className="focus-brand">
          mutiny<span>/</span>
          <strong>{shortCase(caseId)}</strong>
        </span>
        <div>
          <button disabled={!ready || busy || !!error} onClick={share}>
            {copied ? <Check size={15} /> : <Link size={15} />}
            {copied ? "Copied" : "Share view"}
          </button>
          <button
            aria-label="Save superposition figure"
            title="Save figure"
            disabled={!ready || busy || !!error || densityStatus === "error"}
            onClick={saveImage}
          >
            <ImageDown size={17} />
          </button>
          <button aria-label="Close superposition" onClick={onClose}>
            <X size={21} />
          </button>
        </div>
      </header>
      <nav className="focus-steps" aria-label="Superposition story">
        {steps[caseId].map((s, i) => (
          <button
            key={s}
            aria-pressed={step === i}
            onClick={() => selectStep(i)}
          >
            <span>0{i + 1}</span>
            {s}
          </button>
        ))}
      </nav>
      <div
        className="focus-stage"
        data-ready={ready && drawn === drawKey && !error}
        data-density={densityStatus}
        data-context={context}
        data-orbit={orbit}
        aria-busy={busy}
      >
        <div
          ref={div}
          className="focus-canvas"
          aria-label={`Interactive superimposed ${shortCase(caseId)} structures`}
        />
        <div className="focus-annotation">
          <span>{caseId === "hhat" ? "HLA-A*02:06" : "HLA-A*11:01"}</span>
          <h2>
            {!selectedIsStoryResidue
              ? `Position ${residue}`
              : step === 0
                ? caseId === "hhat"
                  ? "L8 → F8"
                  : "G6 → D6"
                : step === 1
                  ? caseId === "hhat"
                    ? "W6 stays W6."
                    : "Q70 · R114"
                  : caseId === "hhat"
                    ? "W6 · Tyr100α"
                    : "JDIa41b1"}
          </h2>
          <p>
            {!selectedIsStoryResidue
              ? "Selected peptide residue"
              : step === 1 && caseId === "hhat"
                ? "Its shape changes."
                : step === 2 && caseId === "kras"
                  ? "An engineered T-cell receptor"
                  : bound
                    ? "Receptor-bound structures"
                    : "Before receptor binding"}
          </p>
        </div>
        <div className="focus-source-tags">
          {ids.map((id, i) => (
            <a
              key={id}
              className={i ? "mutant" : "normal"}
              href={`https://www.rcsb.org/structure/${id}`}
              target="_blank"
              rel="noreferrer"
            >
              {i ? "Mutant" : "Normal"} <span>{id}</span>
            </a>
          ))}
        </div>
        <div className="focus-stage-tools">
          {mode === "both" && <span>Normal HLA reference</span>}
          <button
            aria-label={orbit ? "Pause camera orbit" : "Orbit camera"}
            title={orbit ? "Pause camera orbit" : "Orbit camera"}
            aria-pressed={orbit}
            disabled={!ready || busy || !!error}
            onClick={() => setOrbit((x) => !x)}
          >
            {orbit ? <Pause size={17} /> : <Orbit size={17} />}
          </button>
          <button
            aria-label="Reset superposition camera"
            title="Reset camera"
            onClick={() => setReset((x) => x + 1)}
          >
            <RotateCcw size={17} />
          </button>
        </div>
        <div className="focus-scale" role="group" aria-label="Molecular scale">
          <button aria-pressed={!context} onClick={() => setContext(false)}>
            <Focus size={16} />
            Residue detail
          </button>
          <button aria-pressed={context} onClick={() => setContext(true)}>
            <Scan size={16} />
            Molecular context
          </button>
        </div>
        {context && (
          <div className="focus-context-key">
            <span>
              <i />
              HLA
            </span>
            {step === 2 && (
              <span className="receptor">
                <i />
                T-cell receptor
              </span>
            )}
          </div>
        )}
        {!ready && !error && (
          <div className="focus-loading" role="status">
            Opening experimental structures…
          </div>
        )}
        {error && (
          <div className="focus-loading" role="alert">
            {error}
          </div>
        )}
      </div>
      <footer className="focus-controls">
        <div
          className="focus-state"
          role="group"
          aria-label="Displayed structures"
        >
          {(["normal", "mutant", "both"] as const).map((s) => (
            <button
              key={s}
              className={s}
              aria-pressed={mode === s}
              onClick={() => {
                setMode(s);
                if (s === "both") setDensity(false);
              }}
            >
              <i />
              {s === "both"
                ? "Superimpose"
                : s === "normal"
                  ? "Normal"
                  : "Mutant"}
            </button>
          ))}
        </div>
        <div
          className="focus-sequence"
          role="group"
          aria-label="Select peptide residue"
        >
          {peptide.split("").map((a, i) => (
            <button
              key={i}
              aria-label={`Peptide position ${i + 1}, ${a}`}
              aria-pressed={residue === i + 1}
              className={i === (caseId === "hhat" ? 7 : 5) ? "mutation" : ""}
              onClick={() => {
                setResidue(i + 1);
                setContext(false);
              }}
            >
              {a}
              <small>{i + 1}</small>
            </button>
          ))}
        </div>
        {caseId === "hhat" && (
          <div className="focus-density">
            <button
              className="focus-density-switch"
              aria-pressed={density}
              onClick={() => {
                if (!density && mode === "both") setMode("mutant");
                setDensity((x) => !x);
              }}
            >
              <span>
                <i />
              </span>
              Experimental density
            </button>
            {density && (
              <label>
                2Fo−Fc{" "}
                <select
                  aria-label="Density contour"
                  value={contour}
                  onChange={(e) => setContour(Number(e.target.value))}
                >
                  {[0.7, 1, 1.3, 1.6].map((n) => (
                    <option key={n} value={n}>
                      {n.toFixed(1)} σ
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
      </footer>
      {(density || densityError) && (
        <div className="focus-density-note" role="status">
          {densityError ||
            (densityStatus === "loading"
              ? "Loading experimental density…"
              : "Density around the selected residue · model-phased map")}
          {density && (
            <details>
              <summary>Source & limits</summary>
              <p>
                PDBe 2Fo−Fc map for {ids[mode === "normal" ? 0 : 1]}. Contours
                use the full unit-cell standard deviation before cropping. The
                map is resampled into the HLA-aligned display frame and shown
                within 2 Å of the selected residue. It supports inspection of
                the atomic model; it is not an independent confidence score.
                Prepared locally with Gemmi, not a new Rosalind run.{" "}
                <a
                  href="/density/manifest.json"
                  target="_blank"
                  rel="noreferrer"
                >
                  Map provenance
                </a>
              </p>
            </details>
          )}
        </div>
      )}
      {shareFallback && (
        <label className="focus-share-fallback">
          Copy this view’s link
          <input
            readOnly
            value={shareFallback}
            onFocus={(e) => e.target.select()}
          />
        </label>
      )}
    </dialog>,
    document.body,
  );
}

export default function FocusComparison({
  caseId,
  initialStep = 1,
  initialResidue = 6,
}: {
  caseId: CaseId;
  initialStep?: number;
  initialResidue?: number;
}) {
  const [open, setOpen] = useState(() => location.hash.startsWith("#compare="));
  const [linkKey, setLinkKey] = useState(location.hash);
  useEffect(() => {
    const changed = () => {
      setLinkKey(location.hash);
      setOpen(location.hash.startsWith("#compare="));
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  const close = () => {
    setOpen(false);
    if (location.hash.startsWith("#compare=")) {
      const url = new URL(location.href);
      url.hash = "";
      history.replaceState(history.state, "", url);
    }
  };
  return (
    <>
      <button
        className="project-action focus-launch"
        onClick={() => setOpen(true)}
      >
        <Layers2 size={16} />
        Superimpose in 3D
      </button>
      {open && (
        <FocusDialog
          key={linkKey}
          caseId={caseId}
          initialStep={initialStep}
          initialResidue={initialResidue}
          onClose={close}
        />
      )}
    </>
  );
}
