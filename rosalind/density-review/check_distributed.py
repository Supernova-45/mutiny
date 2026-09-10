"""Independent checks of distributed unbound grids; does not load original maps.
No Gemmi import or reuse of the producer's implementation. Native map review is
separately recorded, and original axis expansion/normalization remain unverified.
"""
from pathlib import Path
import json,gzip,hashlib,itertools
import numpy as np
R=Path(__file__).resolve().parents[2];O=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def atoms(p,chain):
 out={}
 for l in p.read_text().splitlines():
  if not l.startswith('ATOM  ') or l[21]!=chain or l[16]!=' ':continue
  key=(int(l[22:26]),l[26].strip(),l[12:16].strip())
  assert key not in out
  out[key]=np.array([float(l[i:i+8]) for i in [30,38,46]])
 return out
manifest=R/'public/density/manifest.json';m=json.loads(manifest.read_text());rows=[]
for s in m['sources']:
 if s['id'] not in ['6UJQ','6UJO']:continue
 raw=R/s['rawPdbPath'];display=R/'public'/s['displayPath'].lstrip('/');asset=R/'public'/s['path'].lstrip('/')
 for p,key in [(raw,'rawPdbSha256'),(display,'displaySha256'),(asset,'sha256')]:assert sha(p)==s[key]
 values=np.frombuffer(gzip.decompress(asset.read_bytes()),dtype='<f4').reshape(s['size'])
 assert np.isfinite(values).all()
 rot=np.array(s['transform']['rotation']);t=np.array(s['transform']['translation']);assert np.allclose(rot@rot.T,np.eye(3),atol=1e-10);assert abs(np.linalg.det(rot)-1)<1e-10
 a,b=atoms(raw,'A'),atoms(display,'A');keys=[k for k in a if k in b and 1<=k[0]<=180 and k[2]=='CA']
 assert len(keys)==s['transform']['matchedHlaCa']
 errors=[float(np.linalg.norm(a[k]@rot+t-b[k])) for k in keys]
 pa,pb=atoms(raw,'C'),atoms(display,'C');assert pa.keys()==pb.keys()
 peptide_error=max(float(np.linalg.norm(pa[k]@rot+t-pb[k])) for k in pa);assert peptide_error<.0015
 inv_error=max(float(np.linalg.norm((pb[k]-t)@rot.T-pa[k])) for k in pa)
 samples=[]
 for q in s['atomSamples']:
  key=(q['residue'],'',q['atom']);assert np.allclose(q['display'],pb[key],rtol=0,atol=1e-12)
  fractional=(pb[key]-s['origin'])/s['spacing'];lo=np.floor(fractional).astype(int);w=fractional-lo
  assert np.all(lo>=0) and np.all(lo+1<np.array(s['size']))
  v=0.
  for dx,dy,dz in itertools.product([0,1],repeat=3):
   d=np.array([dx,dy,dz]);v+=float(values[tuple(lo+d)])*float(np.prod(np.where(d,w,1-w)))
  samples.append({'residue':q['residue'],'atom':q['atom'],'distributedInterpolatedSigma':v,'manifestOriginalSampleSigma':q['sigma'],'absoluteDifferenceSigma':abs(v-q['sigma'])})
 rows.append({'id':s['id'],'channel':s['channel'],'sourceUrl':s['sourceUrl'],'sourceMapSha256FromManifest':s['sourceMapSha256'],'distributedAssetSha256':sha(asset),'rawPdbSha256':sha(raw),'displayPdbSha256':sha(display),'gridShape':s['size'],'gridSpacingAngstrom':s['spacing'],'normalizationAsDeclared':s['normalization'],'determinant':float(np.linalg.det(rot)),'matchedHlaCa':len(keys),'maxHlaCoordinateResidualAngstrom':max(errors),'maxPeptideCoordinateResidualAngstrom':peptide_error,'maxInversePeptideCoordinateResidualAngstrom':inv_error,'maxDistributedVersusRecordedSourceSampleDifferenceSigma':max(q['absoluteDifferenceSigma'] for q in samples),'samples':samples})
out={'producer':'Local independent NumPy/gzip review; not a Workbench analysis','reviewedManifestSha256':sha(manifest),'sources':rows,'verified':['Original/display PDB and distributed gzip hashes match manifest','Little-endian float32 size, finite grid values, z-fastest reshape','Proper rigid transform and inverse; all corresponding peptide coordinates','Independent trilinear sampling at peptide atoms versus recorded original-map samples'], 'notVerified':['Original CCP4 bytes, axis order, unit-cell symmetry expansion and full-cell mean/SD','Original-frame map appearance and contour usefulness','Native map loading or experimental side-chain certainty'],'interpolationCaveat':'Distributed samples undergo a second trilinear interpolation. Differences from the recorded original-map samples do not alone indicate frame error.'}
(O/'distributed-check.json').write_text(json.dumps(out,indent=2)+'\n')
for r in rows:print(r['id'],'coordinate residual',r['maxPeptideCoordinateResidualAngstrom'],'A; max second-interpolation difference',r['maxDistributedVersusRecordedSourceSampleDifferenceSigma'],'sigma')
