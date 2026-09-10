export function downloadFile(
  content: Blob | string,
  name: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(
    content instanceof Blob ? content : new Blob([content], { type }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.hidden = true;
  // Keep the download in the active modal's DOM: the surrounding document is inert.
  const dialogs = document.querySelectorAll("dialog[open]");
  (dialogs.item(dialogs.length - 1) ?? document.body).appendChild(link);
  link.click();
  link.remove();
  // Give the browser's download process time to consume the blob on slower hosts.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function hashText(text: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export function validView(view: unknown): view is number[] {
  return (
    Array.isArray(view) &&
    view.length === 8 &&
    view.every(
      (v) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e7,
    ) &&
    Math.hypot(...view.slice(4)) > 0.9 &&
    Math.hypot(...view.slice(4)) < 1.1
  );
}
export async function exportFigure(
  images: string[],
  labels: string[],
  caption: string[],
  note: string,
  filename: string,
) {
  const loaded = await Promise.all(
    images.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () =>
            reject(Error("Could not capture the molecular view."));
          img.src = src;
        }),
    ),
  );
  const width = 1600,
    viewHeight = 530,
    canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = 760;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("Figure export is unavailable.");
  ctx.fillStyle = "#f3f1ec";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#252727";
  ctx.font = "500 24px sans-serif";
  loaded.forEach((img, i) => {
    ctx.fillText(labels[i], 40 + i * 800, 43, 720);
    const scale = Math.min(760 / img.width, viewHeight / img.height);
    const w = img.width * scale,
      h = img.height * scale;
    ctx.drawImage(
      img,
      40 + i * 800 + (760 - w) / 2,
      65 + (viewHeight - h) / 2,
      w,
      h,
    );
  });
  ctx.strokeStyle = "#deddd6";
  ctx.beginPath();
  ctx.moveTo(800, 20);
  ctx.lineTo(800, 600);
  ctx.stroke();
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#4d554f";
  caption
    .slice(0, 3)
    .forEach((line, i) => ctx.fillText(line, 40, 635 + i * 24, 1520));
  if (note) {
    ctx.font = "italic 16px sans-serif";
    ctx.fillText(
      `Your note: ${note.replace(/\s+/g, " ").slice(0, 240)}`,
      40,
      719,
      1520,
    );
  }
  ctx.font = "13px sans-serif";
  ctx.fillText("mutiny · static structural comparison", 40, 745);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw Error("Figure export failed.");
  downloadFile(blob, filename, "image/png");
}
