import type { GLViewer } from "3dmol";

export const molecularStyle = {
  background: "#20272d",
  hla: "#81939e",
  normal: "#86b6de",
  mutant: "#a4bfe7",
  mutation: "#efa06e",
  selected: "#70c8b8",
  receptor: "#c4a8e0",
  reference: "#d1d7dd",
  connector: "#baaa94",
};

export function styleViewer(viewer: GLViewer, { outline = true } = {}) {
  viewer.setProjection("orthographic");
  let software = false;
  try {
    const gl = viewer.getRenderer()?.getContext();
    const debug = gl?.getExtension("WEBGL_debug_renderer_info");
    const renderer =
      gl &&
      String(
        gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
      );
    software = /swiftshader|llvmpipe|softpipe|software|swrast/i.test(
      renderer ?? "",
    );
  } catch {
    /* Renderer details may be unavailable under browser privacy settings. */
  }
  const coarse = matchMedia("(pointer: coarse)").matches;
  // Keep ordinary molecular lighting everywhere. Extra shading passes are for GPUs.
  const effects = software || coarse ? [] : ["ambientOcclusion"];
  if (outline && !software) effects.unshift("outline");
  viewer.getCanvas().dataset.graphics = software
    ? "software"
    : coarse
      ? "mobile"
      : "hardware";
  viewer.setViewStyle({
    style: effects.join(" "),
    color: "#11181e",
    width: 0.012,
    strength: outline ? 0.35 : 0.25,
    radius: 2,
  });
}

export const reduceMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export function animateView(
  duration: number,
  draw: (progress: number) => void,
  cancelled: () => boolean,
) {
  if (reduceMotion()) {
    if (!cancelled()) draw(1);
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const frame = (now: number) => {
      if (cancelled()) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - start) / duration);
      draw(1 - Math.pow(1 - progress, 3));
      if (progress === 1) resolve();
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

// Camera interpolation only. Atom coordinates remain the deposited, aligned coordinates.
export function cameraBetween(from: number[], to: number[], t: number) {
  const sign =
    from.slice(4).reduce((sum, v, i) => sum + v * to[i + 4], 0) < 0 ? -1 : 1;
  const q = from.slice(4).map((v, i) => v * (1 - t) + sign * to[i + 4] * t);
  const length = Math.hypot(...q);
  return [
    ...from.slice(0, 4).map((v, i) => v * (1 - t) + to[i] * t),
    ...q.map((v) => v / length),
  ];
}
