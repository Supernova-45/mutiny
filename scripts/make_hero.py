"""Compose actual browser frames into a short, silent README GIF. Requires Pillow."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

root=Path('work/hero-frames')
frames=json.loads((root/'frames.json').read_text())
evidence=json.loads(Path('public/data/hhat-evidence.json').read_text())
ligands={row['id']:row for row in evidence['experiments']}
font_paths=['/System/Library/Fonts/Supplemental/Arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
font_path=next((p for p in font_paths if Path(p).exists()),None)
font=lambda size: ImageFont.truetype(font_path,size) if font_path else ImageFont.load_default(size=size)
output=[]
for frame in frames:
    view=Image.open(root/frame['file']).convert('RGB')
    width=960
    view=view.resize((width,round(view.height*width/view.width)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGB',(width,view.height+104),'#f3f1ec')
    canvas.paste(view,(0,53))
    draw=ImageDraw.Draw(canvas)
    draw.text((18,15),'mutiny',font=font(24),fill='#252727')
    draw.text((width-18,20),frame['title'],font=font(17),fill='#4d554f',anchor='ra')
    if frame['stage']==2:
        normal,mutant=ligands['normal'],ligands['mutant']
        label=f"Receptor binding · Kd (mean ± SD): normal {normal['value']} ± {normal['sd']} µM / mutant {mutant['value']} ± {mutant['sd']} µM · lower = tighter"
    else:
        label='HHAT L75F · HLA-A*02:06 · Devlin et al., 2020'
    draw.text((18,canvas.height-29),label,font=font(14),fill='#4d554f')
    output.append(canvas.quantize(colors=128,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE))
path=Path('outputs/screenshots/mutiny-hero.gif')
output[0].save(path,save_all=True,append_images=output[1:],duration=[f['duration'] for f in frames],loop=0,optimize=True,disposal=2)
print(f'{path}: {len(output)} frames, {sum(f["duration"] for f in frames)/1000:.2f}s, {path.stat().st_size/1024/1024:.2f} MB')
