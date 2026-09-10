"""Public PDBe 2Fo-Fc maps -> small, sigma-scaled display-frame grids.

Requires numpy and gemmi==0.7.3. Original maps cached in work/density, never
modified. A rigid source-to-existing-display transform is recovered from HLA
platform C-alpha correspondences, then independently checked on peptide atoms.
The map is sampled through the inverse transform, not fitted to the peptide.
"""
from pathlib import Path
from datetime import datetime, timezone
import concurrent.futures
import gzip
import hashlib
import json
import urllib.request
import gemmi
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'work/density'
OUT = ROOT / 'public/density'
CACHE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
IDS = ['6UJQ', '6UJO', '6UK2', '6UK4']

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def atoms(path, chain):
    return {(int(l[22:26]), l[12:16].strip()): np.array([float(l[n:n+8]) for n in (30,38,46)])
            for l in path.read_text().splitlines() if l.startswith('ATOM') and l[21] == chain and l[16] in (' ', 'A')}

def fetch(pdb):
    url = f'https://www.ebi.ac.uk/pdbe/coordinates/files/{pdb.lower()}.ccp4'
    path = CACHE / f'{pdb}.ccp4'
    if not path.exists():
        with urllib.request.urlopen(url, timeout=60) as response:
            path.write_bytes(response.read())
    return pdb, url, path

records = []
for pdb, url, source_map in concurrent.futures.ThreadPoolExecutor(max_workers=4).map(fetch, IDS):
    raw = ROOT / f'data/raw/{pdb}.pdb'
    display = ROOT / f'public/structures/{pdb}.pdb'
    a, b = atoms(raw, 'A'), atoms(display, 'A')
    keys = sorted(k for k in a.keys() & b.keys() if k[1] == 'CA' and 1 <= k[0] <= 180)
    x, y = np.array([a[k] for k in keys]), np.array([b[k] for k in keys])
    xc, yc = x.mean(0), y.mean(0)
    u, _, vt = np.linalg.svd((x-xc).T @ (y-yc))
    correction = np.eye(3)
    correction[2,2] = np.linalg.det(u @ vt)
    rotation = u @ correction @ vt
    translation = yc - xc @ rotation
    assert abs(np.linalg.det(rotation)-1) < 1e-10
    pa, pb = atoms(raw, 'C'), atoms(display, 'C')
    pk = sorted(pa.keys() & pb.keys())
    original = np.array([pa[k] for k in pk])
    shown = np.array([pb[k] for k in pk])
    residual = np.linalg.norm(original @ rotation + translation - shown, axis=1)
    assert residual.max() < .0015, (pdb, residual.max())
    # Includes non-orthogonal cells, axis permutations, crystallographic symmetry.
    ccp4 = gemmi.read_ccp4_map(str(source_map), setup=True)
    grid = ccp4.grid
    cryst = next(l for l in raw.read_text().splitlines() if l.startswith('CRYST1'))
    cell = [float(cryst[a:b]) for a,b in [(6,15),(15,24),(24,33),(33,40),(40,47),(47,54)]]
    # CRYST1 cell lengths have 3 decimals; angles only 2. Keep the map's full precision.
    assert np.all(np.abs(np.array(grid.unit_cell.parameters)-cell) <= np.array([.001]*3+[.0051]*3)), f'{pdb}: map/coordinate cell mismatch'
    full = np.asarray(grid)
    assert np.isfinite(full).all(), f'{pdb}: incomplete map coverage'
    mean, sigma = float(full.mean(dtype=np.float64)), float(full.std(dtype=np.float64))
    assert sigma > 0
    spacing = .35  # Angstrom, sampling interval; not experimental resolution.
    origin = np.floor((shown.min(0)-3.5)/spacing)*spacing
    shape = np.ceil((shown.max(0)+3.5-origin)/spacing).astype(int)+1
    points = np.indices(tuple(shape)).reshape(3,-1).T*spacing+origin
    inverse = (points-translation) @ rotation.T
    sampled = grid.interpolate_position_array(np.ascontiguousarray(inverse), order=1)
    values = ((sampled-mean)/sigma).astype('<f4')
    assert np.isfinite(values).all()
    target = OUT / f'{pdb}.bin'
    target.write_bytes(gzip.compress(values.tobytes(), compresslevel=9, mtime=0))
    # Verify inverse mapping against original-frame samples at every peptide atom.
    source_values = grid.interpolate_position_array(np.ascontiguousarray(original), order=1)
    inverse_values = grid.interpolate_position_array(np.ascontiguousarray((shown-translation) @ rotation.T), order=1)
    sample_error = np.max(np.abs(source_values-inverse_values))/sigma
    assert sample_error < .02, (pdb, sample_error)
    record = dict(id=pdb, channel='2Fo-Fc', sourceUrl=url, sourceMapSha256=sha(source_map),
        rawPdbPath=f'data/raw/{pdb}.pdb', rawPdbSha256=sha(raw),
        displayPath=f'/structures/{pdb}.pdb', displaySha256=sha(display),
        path=f'/density/{pdb}.bin', sha256=sha(target), bytes=target.stat().st_size,
        encoding='gzip, little-endian float32; z fastest, then y, then x',
        origin=origin.tolist(), size=shape.tolist(), spacing=spacing,
        unitCell=list(grid.unit_cell.parameters), pdbCell=cell,
        normalization=dict(mean=mean, sigma=sigma, population='full symmetry-expanded unit-cell map; before crop and interpolation'),
        transform=dict(convention='row vector: display = original @ rotation + translation',
                       rotation=rotation.tolist(), translation=translation.tolist(), matchedHlaCa=len(keys)),
        verification=dict(maxPeptideCoordinateErrorAngstrom=float(residual.max()),
                          maxAtomSampleDifferenceSigma=float(sample_error),
                          determinant=float(np.linalg.det(rotation))),
        atomSamples=[dict(residue=k[0], atom=k[1], display=pb[k].tolist(), sigma=float((source_values[i]-mean)/sigma)) for i,k in enumerate(pk)])
    records.append(record)
    print(pdb, tuple(shape), target.stat().st_size, 'bytes', 'max coordinate error', residual.max(), flush=True)
manifest = dict(version=1, generatedAt=datetime.now(timezone.utc).isoformat(), tool=f'Gemmi {gemmi.__version__}, NumPy {np.__version__}',
    producer='Local public-data processing; not a Rosalind operation',
    method='2Fo-Fc map from PDBe, full-unit-cell sigma scaling, inverse rigid-transform trilinear resampling. No local renormalization or sharpening.',
    limitations='Model-phased crystallographic density is experimental support, not independent proof or a confidence score. Contours depend on the chosen threshold. Grid spacing is not resolution.',
    sources=records)
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
