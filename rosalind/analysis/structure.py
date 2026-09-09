"""Independent raw-PDB reconstruction and HLA-fixed geometry; no docking/dynamics."""
from pathlib import Path
import copy, hashlib, io, itertools, json, platform
import numpy as np
import Bio
from Bio.PDB import PDBParser, PDBIO, ShrakeRupley
from Bio.SeqUtils import seq1
from Bio.SVDSuperimposer import SVDSuperimposer
from Bio.PDB.vectors import Vector, calc_dihedral
from scipy.spatial.distance import cdist
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'rosalind'
IDS=['6UJQ','6UJO','6UK2','6UK4']
INDOLE=['CG','CD1','CD2','NE1','CE2','CE3','CZ2','CZ3','CH2']; TYR=['CG','CD1','CD2','CE1','CE2','CZ']
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def xyz(atoms): return np.array([a.coord for a in atoms],dtype=float)
def heavy(res): return [a for a in res.get_atoms() if a.element not in ('H','D')]
def rms(a,b): return float(np.sqrt(np.mean(np.sum((a-b)**2,axis=1))))
def endpoint(a): return dict(chain=a.parent.parent.id,residue=a.parent.id[1],insertionCode=a.parent.id[2].strip(),atom=a.name,xyz=a.coord.tolist())
def fit(m,ref,lo,hi):
 keys=[i for i in range(lo,hi+1) if i in m['A'] and i in ref['A'] and 'CA' in m['A'][i] and 'CA' in ref['A'][i]]
 s=SVDSuperimposer(); s.set(xyz([ref['A'][i]['CA'] for i in keys]),xyz([m['A'][i]['CA'] for i in keys]));s.run(); r,t=s.get_rotran()
 return r,t,dict(selection=f'A CA residues {lo}-{hi}',residueIds=keys,count=len(keys),rmsd=s.get_rms(),rotationRowVector=r.tolist(),translation=t.tolist())
models={}; states=[]; fits={}; original={}
for pdb in IDS:
 path=ROOT/f'data/raw/{pdb}.pdb'; lines=path.read_text().splitlines()
 # Fixed blank/A policy, no occupancy-dependent choice; ATOM-only, first model.
 atomlines=[l for l in lines if l.startswith('ATOM') and l[16] in (' ','A') and l[76:78].strip() not in ('H','D')]
 m=PDBParser(QUIET=True).get_structure(pdb,io.StringIO('\n'.join(atomlines)+'\nEND\n'))[0]
 seqres={}
 for l in lines:
  if l.startswith('SEQRES'): seqres.setdefault(l[11],[]).extend(l[19:70].split())
 chainseq={c:''.join(seq1(x) for x in seq) for c,seq in seqres.items()}
 expected='KQWLVWLFL' if pdb in ('6UJO','6UK4') else 'KQWLVWLLL'
 assert chainseq['C']==expected and ''.join(seq1(r.resname) for r in m['C'])==expected
 assert 'HLA-A206' in '\n'.join(lines[:100]) or 'HLA-A*02:06' in '\n'.join(lines[:100])
 if 'D' in m: assert m['D'][100].resname=='TYR' and 'ALPHA CHAIN' in '\n'.join(lines[:40]) and 'BETA CHAIN' in '\n'.join(lines[:40])
 for c in m:
  observed=''.join(seq1(r.resname) for r in c)
  assert observed in chainseq[c.id],(pdb,c.id,'ATOM sequence not contiguous in SEQRES')
 cryst=next(l for l in lines if l.startswith('CRYST1')); cell=np.array([float(cryst[a:b]) for a,b in ((6,15),(15,24),(24,33))]); assert 'D' not in m or all(float(cryst[a:b])==90 for a,b in ((33,40),(40,47),(47,54)))
 mates=[]
 if 'D' in m:
  ops={}
  for l in lines:
   if l.startswith('REMARK 290   SMTRY'):
    p=l.split();ops.setdefault(int(p[3]),{})[int(p[2][-1])]=[float(v) for v in p[4:8]]
  rec=xyz([a for c in ('D','E') for a in heavy(m[c])]);pep=xyz(heavy(m['C']))
  for op,rows in sorted(ops.items()):
   mat=np.array([rows[i] for i in (1,2,3)])
   for lattice in itertools.product(range(-1,2),repeat=3):
    shift=mat[:,3]+cell*np.array(lattice); trans=rec@mat[:,:3].T+shift
    if np.linalg.norm(trans.mean(0)-pep.mean(0))>65:continue
    dist=cdist(pep,trans); count=int((dist<=4).sum())
    if count: mates.append(dict(operator=op,lattice=list(lattice),rotation=mat[:,:3].tolist(),translation=shift.tolist(),atomPairCount=count,minimumDistance=float(dist.min())))
  assert len(mates)==1
  mate=mates[0];assert mate['operator']==1
  assert mate['lattice']==({'6UK2':[1,-1,0],'6UK4':[0,1,0]}[pdb])
  for c in ('D','E'):
   for a in m[c].get_atoms():a.coord=a.coord@np.array(mate['rotation']).T+mate['translation']
 original[pdb]=copy.deepcopy(m)
 models[pdb]=m
 states.append(dict(id=pdb,structureType='measured',method='X-ray crystallography',sourceUrl=f'https://www.rcsb.org/structure/{pdb}',inputPath=str(path.relative_to(ROOT)),sha256=sha(path),peptide=expected,allele='HLA-A*02:06',chainRoles={'A':'HLA heavy chain','B':'beta-2-microglobulin','C':'HHAT peptide',**({'D':'302TIL alpha','E':'302TIL beta'} if mates else {})},depositedChainSequences=chainseq,crystalMateSearch={'operators':len(ops) if mates else None,'latticeRange':[-1,1],'contactingMates':mates,'reason':None if mates else 'No receptor in pMHC structure'}))
ref=copy.deepcopy(models['6UJQ'])
for state in states:
 pdb=state['id']; m=models[pdb]; r,t,details=fit(m,ref,1,180); fits[pdb]=(r,t);state['alignment']=details
 # SASA before rotating: fixed sampling grid matches documented original method.
 pmhc=copy.deepcopy(m)
 for c in list(pmhc):
  if c.id not in ('A','B','C'):pmhc.detach_child(c.id)
 ShrakeRupley(probe_radius=1.4,n_points=200).compute(m,level='R');ShrakeRupley(probe_radius=1.4,n_points=200).compute(pmhc,level='R')
 state['accessibility']=[dict(position=i,wholeResiduePmhcSasa=pmhc['C'][i].sasa,wholeResidueComplexSasa=m['C'][i].sasa if 'D' in m else None,complexMissingReason=None if 'D' in m else 'Receptor-free state',unit='angstrom^2') for i in (6,8)]
 for a in m.get_atoms():a.coord=a.coord@r+t
 state['coordinatePath']=f'rosalind/structures/{pdb}.pdb'; writer=PDBIO();writer.set_structure(m);writer.save(str(ROOT/state['coordinatePath']));state['coordinateSha256']=sha(ROOT/state['coordinatePath'])
 w=m['C'][6];state['w6Torsions']={name:dict(atoms=atoms,value=float(np.degrees(calc_dihedral(*[Vector(w[a].coord) for a in atoms]))),unit='degree') for name,atoms in [('chi1',['N','CA','CB','CG']),('chi2',['CA','CB','CG','CD1'])]}
 state['contacts']=[]
 if 'D' in m:
  for i in (6,8):
   aa=heavy(m['C'][i]);contacts=[]
   for c in ('D','E'):
    for residue in m[c]:
     bb=heavy(residue); ds=cdist(xyz(aa),xyz(bb)); ix=np.unravel_index(ds.argmin(),ds.shape)
     if ds[ix]<=4:contacts.append(dict(receptorChain=c,receptorResidue=residue.id[1],receptorName=residue.resname,distance=float(ds[ix]),endpoints=[endpoint(aa[ix[0]]),endpoint(bb[ix[1]])]))
   state['contacts'].append(dict(position=i,cutoff=4,unit='angstrom',uniqueResidues=contacts))
  tyr=m['D'][100];wa=heavy(w);ta=heavy(tyr);ds=cdist(xyz(wa),xyz(ta));ix=np.unravel_index(ds.argmin(),ds.shape)
  centroid=xyz([tyr[a] for a in TYR]).mean(0)
  state['w6Tyr100Alpha']={'minimumHeavyAtom':dict(value=float(ds[ix]),endpoints=[endpoint(wa[ix[0]]),endpoint(ta[ix[1]])]),'indoleNitrogenToTyrRingCentroid':dict(value=float(np.linalg.norm(w['NE1'].coord-centroid)),endpoints=[endpoint(w['NE1']),dict(chain='D',residue=100,atoms=TYR,kind='unweighted ring centroid',xyz=centroid.tolist())]),'ringCentroidToRingCentroid':dict(value=float(np.linalg.norm(xyz([w[a] for a in INDOLE]).mean(0)-centroid)),atomLists=[INDOLE,TYR]),'unit':'angstrom'}
def comparison(a,b,pos,atoms):
 ra=models[a]['C'][pos];rb=models[b]['C'][pos];missing=[x for x in atoms if x not in ra or x not in rb]
 return dict(atoms=atoms,rmsd=None if missing or not atoms else rms(xyz([ra[x] for x in atoms]),xyz([rb[x] for x in atoms])),unit='angstrom',missingReason=f'Missing atoms {missing}' if missing else ('Nonmatching residue identities' if not atoms else None))
pairs=[]
for a,b in [('6UJQ','6UJO'),('6UK2','6UK4')]:
 residues=[]
 for i in range(1,10):
  ra=models[a]['C'][i];rb=models[b]['C'][i];side=sorted(x.name for x in heavy(ra) if x.name not in ['N','CA','C','O','OXT']) if ra.resname==rb.resname else []
  residues.append(dict(position=i,backbone=comparison(a,b,i,['N','CA','C','O']),sidechain=comparison(a,b,i,side)))
 pairs.append(dict(states=[a,b],residues=residues))
w6=[]
for a,b in [('6UJQ','6UK2'),('6UJO','6UK4'),('6UJQ','6UJO'),('6UK2','6UK4')]:
 v=comparison(a,b,6,INDOLE);alt=[]
 for pdb in (a,b):
  r,t,d=fit(original[pdb],ref,5,175);alt.append(xyz([original[pdb]['C'][6][x] for x in INDOLE])@r+t)
 v.update(states=[a,b],sensitivity=dict(selection='A CA residues 5-175',rmsd=rms(*alt),unit='angstrom'));w6.append(v)
for s in states:s['sensitivityAlignment']=fit(original[s['id']],ref,5,175)[2]
out=dict(schemaVersion='0.1.0',packId='hhat-mechanism-v1',projectId='hhat-structural-case',projectFingerprint=hashlib.sha256(''.join(s['sha256'] for s in states).encode()).hexdigest(),requestId=None,selectedCandidateIds=['HHAT:L75','HHAT:L75F'],findings=[dict(candidateId=c,status='resolved',claimIds=['HHAT-G1','HHAT-G2','HHAT-I1']) for c in ['HHAT:L75','HHAT:L75F']],proposedCorrections=[],unsupported=[dict(task='Rosalind Workbench execution and screenshots',reason='No callable Workbench or connected scientific plugin in this session')],provenance=dict(execution='local Python, not Workbench',script='rosalind/analysis/structure.py',python=platform.python_version(),numpy=np.__version__,biopython=Bio.__version__),coordinateFrame=dict(id='6UJQ-HLA-raw',reference='6UJQ',unit='angstrom',convention='row vector: x_aligned = x_reconstructed @ rotation + translation',displayRotation=None,precision='JSON full float; exported PDB 0.001 angstrom',uncertainty='Coordinate differences are static crystal geometry; no statistical coordinate uncertainty estimated'),atomPolicy='First deposited model; ATOM records; heavy atoms; blank/A altloc; identical policy in all states; retain chain/residue/insertion numbering; no waters/ligands',sasaMethod='Biopython Shrake-Rupley; probe 1.4 angstrom; 200 points; deposited orientation after receptor reconstruction; whole residue; pMHC A/B/C versus complete protein complex',states=states,perResidueComparisons=pairs,w6Comparisons=w6,displaySelections={'mutation':{'chain':'C','residue':8},'neighbor':{'chain':'C','residue':6,'atoms':INDOLE},'receptorContact':{'chain':'D','residue':100,'atoms':TYR}})
(OUT/'mechanism.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'w6':w6,'fits':[(s['id'],s['alignment']['rmsd']) for s in states]},indent=2))
