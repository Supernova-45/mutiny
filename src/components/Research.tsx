import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, Download, FileUp } from "lucide-react";
import {
  compareProject,
  MAX_PROJECT_BYTES,
  parseProject,
  safeSourceUrl,
  saveReview,
  type Project,
} from "../lib/project.mjs";

export default function Research() {
  const [project, setProject] = useState<Project | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [group, setGroup] = useState(""),
    [methods, setMethods] = useState(["", ""]),
    [k, setK] = useState(5),
    [selected, setSelected] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const open = (text: string) => {
    const p = parseProject(text),
      v = p.view;
    const g = p.groups.some((g) => g.id === v.groupId)
      ? String(v.groupId)
      : (p.groups[0]?.id ?? "");
    const candidate =
      p.candidates.find(
        (c) => c.id === v.selectedCandidateId && c.groupId === g,
      ) ?? p.candidates.find((c) => c.groupId === g);
    setProject(p);
    setGroup(g);
    setSelected(candidate?.id ?? "");
    setMethods([
      p.methods.some((m) => m.id === v.methodA)
        ? String(v.methodA)
        : (p.methods[0]?.id ?? ""),
      p.methods.some((m) => m.id === v.methodB)
        ? String(v.methodB)
        : (p.methods[1]?.id ?? p.methods[0]?.id ?? ""),
    ]);
    setK(
      typeof v.inspectedCount === "number" && Number.isFinite(v.inspectedCount)
        ? Math.max(1, Math.floor(v.inspectedCount))
        : 5,
    );
    setError("");
  };
  const loadExample = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/research/hcc1395.project.json");
      if (!r.ok) throw Error("Example unavailable");
      open(await r.text());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const comparison = useMemo(
    () =>
      project
        ? compareProject(project, group, methods[0], methods[1], k)
        : null,
    [project, group, methods, k],
  );
  const candidate = project?.candidates.find((c) => c.id === selected);
  const sequence = project?.sequences.find(
    (s) => s.id === candidate?.sequenceId,
  );
  const review = project?.annotations.find(
    (a) => a.kind === "mutiny-review" && a.candidateId === selected,
  );
  const source = project?.sources.find((s) => s.id === candidate?.sourceId);
  const sourceUrl = source ? safeSourceUrl(source.url) : null;
  const save = () => {
    if (!project) return;
    const snapshot = {
      ...project,
      view: {
        ...project.view,
        groupId: group,
        methodA: methods[0],
        methodB: methods[1],
        inspectedCount: k,
        selectedCandidateId: selected,
      },
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(snapshot, null, 2) + "\n"], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.projectId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80)}.project.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const patchReview = (patch: { note?: string; status?: string }) =>
    setProject((p) => (p ? saveReview(p, selected, patch) : p));
  const positions = comparison?.orders.map((rows) =>
    rows.findIndex((r) => r.candidate.id === selected),
  ) ?? [-1, -1];
  return (
    <main className="research-page">
      <section className="intro-bar">
        <div>
          <h1>Which candidates deserve a closer look?</h1>
          {project && <p className="study-context">{project.title}</p>}
        </div>
      </section>
      <div className="research-toolbar">
        <div>
          <button
            className="project-action"
            onClick={() => file.current?.click()}
          >
            <FileUp size={16} /> Open project
          </button>
          {project && (
            <button className="project-action" onClick={save}>
              <Download size={16} /> Save project
            </button>
          )}
        </div>
        <button className="text-button" disabled={busy} onClick={loadExample}>
          {busy ? "Opening example…" : "HCC1395 example"}{" "}
          <ArrowUpRight size={13} />
        </button>
      </div>
      <input
        ref={file}
        className="file-input"
        type="file"
        accept=".json,application/json"
        aria-label="Open project JSON"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setError("");
          if (f.size > MAX_PROJECT_BYTES) {
            setError("Project exceeds the 8 MB JSON limit.");
            return;
          }
          try {
            open(await f.text());
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      />
      {error && (
        <p className="project-error" role="alert">
          {error}
        </p>
      )}
      {!project ? (
        <section className="research-empty">
          <div className="rank-motif" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} style={{ width: `${90 - i * 13}%` }}>
                <i />
                <b />
              </span>
            ))}
          </div>
          <div>
            <h2>Bring your candidate sequences and declared score methods</h2>
            <button
              className="project-action primary"
              disabled={busy}
              onClick={loadExample}
            >
              Explore 11 published candidates <ArrowUpRight size={15} />
            </button>
            <a
              className="text-button"
              href="/research/hcc1395.project.json"
              download
            >
              Example project JSON <Download size={13} />
            </a>
          </div>
        </section>
      ) : (
        <div className="research-layout">
          <section
            className="ranking-workspace"
            aria-label="Compare candidate rankings"
          >
            <div className="research-controls">
              <label>
                Group
                <select
                  value={group}
                  onChange={(e) => {
                    setGroup(e.target.value);
                    setSelected(
                      project.candidates.find(
                        (c) => c.groupId === e.target.value,
                      )?.id ?? "",
                    );
                  }}
                >
                  {project.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="k-control">
                Targets inspected <strong>{comparison!.k}</strong>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, comparison!.eligible)}
                  value={Math.min(k, Math.max(1, comparison!.eligible))}
                  disabled={!comparison!.eligible}
                  onChange={(e) => setK(Number(e.target.value))}
                />
              </label>
            </div>
            <div className="rank-summary">
              <span>
                <strong>{comparison!.overlap}</strong> shared in the first{" "}
                {comparison!.k}
              </span>
              <span>
                {comparison!.eligible} comparable ·{" "}
                {comparison!.excluded.length} excluded
              </span>
            </div>
            {comparison!.tied && (
              <p className="tie-note">
                A score tie crosses the cutoff. Stable IDs determine the
                displayed order.
              </p>
            )}
            <div className="rank-methods">
              {[0, 1].map((i) => (
                <label key={i}>
                  <span>{i === 0 ? "First method" : "Second method"}</span>
                  <select
                    aria-label={i === 0 ? "First method" : "Second method"}
                    value={methods[i]}
                    onChange={(e) =>
                      setMethods((m) =>
                        m.map((v, j) => (j === i ? e.target.value : v)),
                      )
                    }
                  >
                    {project.methods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id}
                      </option>
                    ))}
                  </select>
                  <small>
                    {project.methods.find((m) => m.id === methods[i])
                      ?.endpoint ?? "No scores supplied"}
                  </small>
                </label>
              ))}
            </div>
            <div className="rank-lanes">
              {comparison!.orders.map((rows, i) => (
                <div className="rank-lane" key={i}>
                  {rows.slice(0, 100).map((r, index) => (
                    <button
                      key={r.candidate.id}
                      className={`rank-entry ${selected === r.candidate.id ? "selected" : ""} ${index < comparison!.k ? "in-budget" : ""}`}
                      onClick={() => setSelected(r.candidate.id)}
                      aria-pressed={selected === r.candidate.id}
                    >
                      <span className="rank-number">{index + 1}</span>
                      <span>
                        <strong>{r.candidate.gene ?? r.candidate.id}</strong>
                        <small>
                          {
                            project.sequences.find(
                              (s) => s.id === r.candidate.sequenceId,
                            )?.sequence
                          }
                        </small>
                      </span>
                      <span className="rank-score">
                        {r.scores[i].value?.toLocaleString(undefined, {
                          maximumSignificantDigits: 3,
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
              {positions.every((p) => p >= 0 && p < 100) && (
                <svg
                  className="rank-connection"
                  viewBox={`0 60 80 ${Math.max(1, Math.min(100, comparison!.eligible)) * 54}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d={`M0 ${positions[0] * 54 + 87} C40 ${positions[0] * 54 + 87},40 ${positions[1] * 54 + 87},80 ${positions[1] * 54 + 87}`}
                  />
                </svg>
              )}
            </div>
            {comparison!.eligible > 100 && (
              <p className="format-note">
                First 100 ranks shown. All candidates remain available in the
                selector.
              </p>
            )}
            {comparison!.excluded.length > 0 && (
              <details className="excluded-candidates">
                <summary>
                  {comparison!.excluded.length} excluded from this comparison
                </summary>
                {comparison!.excluded.map(({ candidate, reason }) => (
                  <button
                    key={candidate.id}
                    onClick={() => setSelected(candidate.id)}
                  >
                    <span>{candidate.gene ?? candidate.id}</span>
                    <small>{reason}</small>
                  </button>
                ))}
              </details>
            )}
            <p className="review-scope">
              {project.outcomes.length
                ? "Supplied experiments are preserved in your project. This view compares scores only."
                : "No response outcomes supplied."}
            </p>
          </section>
          <aside
            className="research-inspector"
            aria-label="Review selected candidate"
          >
            <label className="candidate-select">
              Candidate
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {project.candidates
                  .filter((c) => c.groupId === group)
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.gene ?? c.id} · {c.id}
                    </option>
                  ))}
              </select>
            </label>
            {candidate && (
              <>
                <h2>{candidate.gene ?? "Candidate"}</h2>
                <p className="candidate-hla">
                  {candidate.hla ?? "HLA unspecified"}
                </p>
                <div
                  className="research-sequence"
                  aria-label={`${sequence?.role.replaceAll("_", " ")} sequence`}
                >
                  {sequence?.sequence}
                </div>
                <p className="sequence-role">
                  {sequence?.role.replaceAll("_", " ")}
                </p>
                <div className="research-scores">
                  {project.methods
                    .filter((m) => methods.includes(m.id))
                    .map((m) => {
                      const scores = project.scores.filter(
                        (s) =>
                          s.candidateId === selected && s.methodId === m.id,
                      );
                      return (
                        <div key={m.id}>
                          <span>{m.id}</span>
                          <strong>
                            {scores.length === 1 &&
                            scores[0].status === "available" ? (
                              <>
                                {scores[0].value?.toLocaleString(undefined, {
                                  maximumSignificantDigits: 4,
                                })}{" "}
                                <small>{m.unit}</small>
                              </>
                            ) : (
                              "Unresolved"
                            )}
                          </strong>
                          <small>
                            {m.versionStatus === "not_reported"
                              ? "Predictor version not reported"
                              : m.version}
                          </small>
                        </div>
                      );
                    })}
                </div>
                <label className="review-label">
                  Review
                  <select
                    aria-label="Review status"
                    value={review?.status ?? "unreviewed"}
                    onChange={(e) => patchReview({ status: e.target.value })}
                  >
                    <option value="unreviewed">Unreviewed</option>
                    <option value="investigate">Investigate</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                </label>
                <label className="review-label">
                  Notes
                  <textarea
                    aria-label="Candidate notes"
                    value={review?.note ?? ""}
                    onChange={(e) => patchReview({ note: e.target.value })}
                    placeholder="What needs checking?"
                    rows={4}
                  />
                </label>
                {sourceUrl && (
                  <a
                    className="text-button candidate-source"
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source data <ArrowUpRight size={13} />
                  </a>
                )}
                <p className="format-note">
                  Save project to keep your notes and current comparison.
                </p>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
