"""Compose actual browser frames into a short, silent README GIF. Requires Pillow."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw, ImageFont

root = Path("work/hero-frames")
frames = json.loads((root / "frames.json").read_text())
evidence = json.loads(Path("public/data/hhat-evidence.json").read_text())
ligands = {row["id"]: row for row in evidence["experiments"]}
font_paths = ["/System/Library/Fonts/Supplemental/Arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
font_path = next((p for p in font_paths if Path(p).exists()), None)


def font(size):
    return ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default(size=size)


width = 720
output = []
for frame in frames:
    view = Image.open(root / frame["file"]).convert("RGB")
    view = view.resize((width, round(view.height * width / view.width)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (width, view.height + 94), "#f3f1ec")
    canvas.paste(view, (0, 42))
    draw = ImageDraw.Draw(canvas)
    draw.text((14, 10), "mutiny", font=font(22), fill="#252727")
    draw.text((width - 14, 15), frame["title"], font=font(15), fill="#4d554f", anchor="ra")
    if frame["stage"] == 2:
        normal, mutant = ligands["normal"], ligands["mutant"]
        label = f"Receptor binding: normal {normal['value']} ± {normal['sd']} µM · mutant {mutant['value']} ± {mutant['sd']} µM"
        detail = "Kd · mean ± SD · lower = tighter · Devlin et al., 2020"
    else:
        label = "HHAT L75F · HLA-A*02:06"
        detail = "Experimental structures · Devlin et al., 2020"
    draw.text((14, canvas.height - 42), label, font=font(14), fill="#4d554f")
    draw.text((14, canvas.height - 22), detail, font=font(12), fill="#4d554f")
    # Octree keeps sparse residue accent colors that median-cut merges into the background.
    output.append(canvas.quantize(colors=128, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE))

path = Path("outputs/screenshots/mutiny-hero.gif")
output[0].save(path, save_all=True, append_images=output[1:],
               duration=[f["duration"] for f in frames], loop=0, optimize=True, disposal=2)
provenance_path = Path("outputs/hero-loop.provenance.json")
provenance = json.loads(provenance_path.read_text())
provenance["encoded"] = {"path": str(path), "width": width, "height": output[0].height,
                         "frames": len(output), "durationMs": sum(f["duration"] for f in frames),
                         "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
provenance_path.write_text(json.dumps(provenance, indent=2) + "\n")
print(f'{path}: {len(output)} frames, {provenance["encoded"]["durationMs"]/1000:.2f}s, {path.stat().st_size/1024/1024:.2f} MB')
