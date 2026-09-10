"""Independent float64 SVD/Kabsch oracle and explicit source-identity mapping.
Never fits peptide coordinates; never repairs missing residues or swaps symmetry.
"""
from pathlib import Path
from collections import OrderedDict
import json,hashlib
import numpy as np
from Bio.Data.PDBData import protein_letters_3to1
R=Path(__file__).resolve().parents[2];O=Path(__file__).resolve().parent
BB={'N','CA','C','O','OXT'}
def parse(path):
 atoms=OrderedDict();model=False
 for line in Path(path).read_text().splitlines():
  if line.startswith('MODEL '):
   if model:break
   model=True;continue
  if line.startswith('ENDMDL'):break
  if not line.startswith('ATOM  ') or line[16] not in (' ','A'):continue
  name=line[12:16].strip();element=line[76:78].strip() or name.lstrip('0123456789')[0]
  if element in ['H','D']:continue
  key=(line[21],int(line[22:26]),line[26].strip(),name)
  if key in atoms and atoms[key]['altloc']==line[16]:raise ValueError('Duplicate atom identity')
  if key not in atoms or line[16]==' ':
   atoms[key]={'name':name,'resname':line[17:20],'altloc':line[16],'occupancy':float(line[54:60]),'xyz':np.array([float(line[k:k+8]) for k in [30,38,46]])}
 chains=OrderedDict()
 for (chain,n,ins,name),a in atoms.items():
  residues=chains.setdefault(chain,OrderedDict());residue=residues.setdefault((n,ins),{'aa':protein_letters_3to1.get(a['resname'],'X'),'resname':a['resname'],'atoms':OrderedDict()});residue['atoms'][name]=a
 return chains
def sequence(chain):return ''.join(x['aa'] for x in chain.values())
def fit(mobile,reference):
 a=np.array(mobile,dtype=float);b=np.array(reference,dtype=float);ac=a.mean(0);bc=b.mean(0)
 u,s,vt=np.linalg.svd((a-ac).T@(b-bc));d=np.eye(3);d[-1,-1]=np.linalg.det(u@vt);rot=u@d@vt;t=bc-ac@rot
 return {'rotationRowVector':rot.tolist(),'translation':t.tolist(),'determinant':float(np.linalg.det(rot)),'rmsd':float(np.sqrt(np.mean(np.sum((a@rot+t-b)**2,axis=1)))),'atomCount':len(a),'singularValues':s.tolist()},lambda x:np.array(x)@rot+t
def compare(a,b,assign,mode='strict-whole'):
 h=[a[assign[0]['hla']],b[assign[1]['hla']]];p=[a[assign[0]['peptide']],b[assign[1]['peptide']]]
 if mode=='strict-whole':
  if sequence(h[0])!=sequence(h[1]):raise ValueError('observed_hla_sequence_mismatch')
  pairs=list(zip(h[0],h[1]))
 else:
  pairs=[(k,k) for k in h[0] if k in h[1] and (mode!='platform' or 1<=k[0]<=180)]
  if any(h[0][i]['aa']!=h[1][j]['aa'] for i,j in pairs):raise ValueError('shared_residue_mismatch')
 pairs=[(i,j) for i,j in pairs if 'CA' in h[0][i]['atoms'] and 'CA' in h[1][j]['atoms']]
 f,apply=fit([h[1][j]['atoms']['CA']['xyz'] for i,j in pairs],[h[0][i]['atoms']['CA']['xyz'] for i,j in pairs]);f.update(mode=mode,referenceChain=assign[0]['hla'],mobileChain=assign[1]['hla'],residuePairs=[{'reference':[i[0],i[1]],'mobile':[j[0],j[1]]} for i,j in pairs],excludedReference=[list(k) for k in h[0] if k not in [i for i,j in pairs]],excludedMobile=[list(k) for k in h[1] if k not in [j for i,j in pairs]])
 if len(p[0])!=len(p[1]):raise ValueError('peptide_coverage_mismatch')
 differences=[]
 for pos,((ka,ra),(kb,rb)) in enumerate(zip(p[0].items(),p[1].items()),1):
  def measure(backbone):
   names=[n for n in ra['atoms'] if n in rb['atoms'] and ((n in {'N','CA','C','O'}) if backbone else (n not in BB))]
   missingA=[n for n in rb['atoms'] if n not in ra['atoms'] and (n not in BB if not backbone else n in BB)]
   missingB=[n for n in ra['atoms'] if n not in rb['atoms'] and (n not in BB if not backbone else n in BB)]
   value=float(np.sqrt(np.mean([np.sum((ra['atoms'][n]['xyz']-apply(rb['atoms'][n]['xyz']))**2) for n in names]))) if names else None
   return {'value':value,'atoms':names,'missingNormal':missingA,'missingMutant':missingB}
  differences.append({'position':pos,'normal':ra['aa'],'mutant':rb['aa'],'sourceResidues':[{'chain':assign[0]['peptide'],'number':ka[0],'insertion':ka[1]},{'chain':assign[1]['peptide'],'number':kb[0],'insertion':kb[1]}],'backbone':measure(True),'sidechain':measure(False) if ra['aa']==rb['aa'] else {'value':None,'atoms':[]}})
 return {'alignment':f,'differences':differences,'sequences':[sequence(x) for x in p],'mapping':[{'sourceChain':assign[i]['hla'],'displayChain':'A','residues':[{'sourceNumber':n,'sourceInsertion':ins,'displayPosition':j+1,'aa':r['aa']} for j,((n,ins),r) in enumerate(h[i].items())]} for i in [0,1]],'policy':'Float64 NumPy SVD Kabsch with det +1. Peptide never fitted. Common atom names only; mutation sidechain unavailable; no symmetry remap.'}
def write(path,data):Path(path).write_text(json.dumps(data,indent=2)+'\n')
if __name__=='__main__':
 assign=[{'hla':'A','peptide':'C'}]*2
 hhat=compare(parse(R/'data/raw/6UJQ.pdb'),parse(R/'data/raw/6UJO.pdb'),assign)
 write(O/'hhat-independent.json',hhat)
 kras=R/'rosalind/contrast-kras/sources';a=parse(kras/'7OW5.pdb');b=parse(kras/'7OW6.pdb')
 try:compare(a,b,assign)
 except ValueError as e:strict={'status':'rejected','reason':str(e)}
 else:raise AssertionError('KRAS must reject strict observed identity')
 out={'strictCurrentImporter':strict,'commonAuthorWhole':compare(a,b,assign,'common-author-whole'),'platform':compare(a,b,assign,'platform')}
 write(R/'rosalind/contrast-kras/independent-comparison.json',out)
 print('HHAT',hhat['alignment']['rmsd'],hhat['alignment']['atomCount']);print('KRAS',[(k,v['alignment']['rmsd'],v['alignment']['atomCount']) for k,v in out.items() if 'alignment' in v])
