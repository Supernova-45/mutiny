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

export function styleViewer(viewer: GLViewer) {
  viewer.setProjection("orthographic");
  viewer.setViewStyle({
    style: matchMedia("(pointer: coarse)").matches
      ? "outline"
      : "outline ambientOcclusion",
    color: "#11181e",
    width: 0.012,
    strength: 0.35,
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
