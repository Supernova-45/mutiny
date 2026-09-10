// Links contain a curated view only. Never include local PDBs or user notes.
export function parseFocusLink(hash) {
  if (!hash.startsWith("#compare=")) return null;
  try {
    if (hash.length > 4000) throw Error();
    const s = JSON.parse(decodeURIComponent(hash.slice(9)));
    const camera = s.camera;
    if (
      s.version !== 1 ||
      !["hhat", "kras"].includes(s.caseId) ||
      !Number.isInteger(s.step) ||
      s.step < 0 ||
      s.step > 2 ||
      !Number.isInteger(s.residue) ||
      s.residue < 1 ||
      s.residue > (s.caseId === "hhat" ? 9 : 10) ||
      !["normal", "mutant", "both"].includes(s.mode) ||
      typeof s.density !== "boolean" ||
      (s.density && (s.caseId !== "hhat" || s.mode === "both")) ||
      ![0.7, 1, 1.3, 1.6].includes(s.contour) ||
      !/^[a-f0-9]{64}$/.test(s.sources) ||
      (camera !== null &&
        (!Array.isArray(camera) ||
          camera.length !== 8 ||
          !camera.every(
            (v) =>
              typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e5,
          ) ||
          Math.abs(Math.hypot(...camera.slice(4)) - 1) > 0.01))
    )
      throw Error();
    return s;
  } catch {
    throw Error(
      "This shared 3D view is invalid. Close it to explore the current examples.",
    );
  }
}
export function focusLink(base, state) {
  const url = new URL(base);
  url.searchParams.set("case", state.caseId);
  url.hash = "compare=" + encodeURIComponent(JSON.stringify(state));
  parseFocusLink(url.hash);
  return url.href;
}
