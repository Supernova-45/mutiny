"""Controlled format/coverage fixtures, explicitly not additional experimental states."""
from pathlib import Path
import json,hashlib
from independent import parse,compare
R=Path(__file__).resolve().parents[2];O=Path(__file__).resolve().parent;F=O/'fixtures';F.mkdir(exist_ok=True)
n=(R/'data/raw/6UJQ.pdb').read_text();m=(R/'data/raw/6UJO.pdb').read_text();cases=[]
def transform(text,fn):
 out=[]
 for l in text.splitlines():
  v=fn(l) if l.startswith('ATOM  ') else l
  if v is not None:out.extend(v if isinstance(v,list) else [v])
 return '\n'.join(out)+'\n'
def add(id,normal,mutant,assign=None,status='accepted',purpose='',meta=None):
 paths=[]
 for role,text in [('normal',normal),('mutant',mutant)]:
  p=F/(id+'-'+role+'.pdb');p.write_text(text);paths.append(str(p.relative_to(R)))
 a=assign or [{'hla':'A','peptide':'C'}]*2
 row={'id':id,'paths':paths,'assignment':a,'expectedStatus':status,'purpose':purpose,'coordinateProvenance':'Controlled derivative of HHAT for software verification; not a new crystal, predicted model or biological variant','metadata':meta or {},'sourceHashes':[hashlib.sha256((R/p).read_bytes()).hexdigest() for p in paths]}
 if status=='accepted':row['independent']=compare(parse(R/paths[0]),parse(R/paths[1]),a)
 cases.append(row)
add('hhat-original',n,m,purpose='Actual normal/mutant HHAT deposited pair')
add('different-chains',n,transform(m,lambda l:l[:21]+{'A':'H','C':'P'}.get(l[21],l[21])+l[22:]),[{'hla':'A','peptide':'C'},{'hla':'H','peptide':'P'}],purpose='Assigned chains differ; peptide source identity must survive display normalization')
def renumber(l):
 if l[21] not in 'AC':return l
 k=int(l[22:26]);num=k+200;ins=' '
 if l[21]=='C' and k==6:num=205;ins='A'
 return l[:22]+f'{num:4d}'+ins+l[27:]
add('renumber-insertion',n,transform(m,renumber),purpose='Sequence-position correspondence despite author offset; mutant W6 maps to C205A')
add('missing-hla-residue',n,transform(m,lambda l:None if l[21]=='A' and int(l[22:26])==100 else l),status='rejected',purpose='Current release rejects unequal observed HLA sequences')
add('missing-hla-ca',n,transform(m,lambda l:None if l[21]=='A' and int(l[22:26])==100 and l[12:16].strip()=='CA' else l),purpose='Residue remains observed; only 274 HLA CA pairs fit')
add('missing-w6-sidechain',n,transform(m,lambda l:None if l[21]=='C' and int(l[22:26])==6 and l[12:16].strip() not in ['N','CA','C','O'] else l),purpose='No common W6 side-chain atoms => null, not zero')
add('missing-w6-cg',n,transform(m,lambda l:None if l[21]=='C' and int(l[22:26])==6 and l[12:16].strip()=='CG' else l),purpose='Subset common-atom RMSD must disclose reduced atom coverage')
add('different-bound-states',n,(R/'data/raw/6UK4.pdb').read_text(),purpose='Actual WT free vs mutant receptor-bound; numerical acceptance does not control receptor state',meta={'normalReceptorState':'free','mutantReceptorState':'302TIL-bound'})
add('declared-predicted',n,m,purpose='Metadata-only provenance test; same experimental coordinate bytes with deliberately conflicting user declaration',meta={'normalDeclaredProvenance':'experimental','mutantDeclaredProvenance':'predicted','actualCoordinates':'Both experimental; no predicted model created'})
def alt(l):
 if l[21]=='C' and int(l[22:26])==6 and l[12:16].strip()=='CG':
  shifted=l[:16]+'A'+l[17:30]+f'{float(l[30:38])+5:8.3f}'+l[38:54]+'  0.90'+l[60:]
  return [shifted,l[:54]+'  0.10'+l[60:]]
 return l
add('altloc-blank-preferred',n,transform(m,alt),purpose='Blank is selected over A even at lower occupancy; not occupancy-aware')
add('zero-occupancy',n,transform(m,lambda l:l[:54]+'  0.00'+l[60:] if l[21]=='C' and int(l[22:26])==6 else l),purpose='Current parser includes zero-occupancy atoms; proposed rule must reject/explicitly exclude')
def substitution(l):
 if l[21]=='C' and int(l[22:26])==1:
  if l[12:16].strip() not in ['N','CA','C','O','CB']:return None
  return l[:17]+'ALA'+l[20:]
 if l[21]=='C' and int(l[22:26])==8:
  name=l[12:16].strip();other={'CD1':'CD2','CD2':'CD1','CE1':'CE2','CE2':'CE1'}.get(name,name)
  return l[:12]+(' '+other.ljust(3))+l[16:]
 return l
add('symmetric-phenyl-labels',m,transform(m,substitution),purpose='Synthetic K1A deletion-only test plus identical P8 phenyl coordinates with symmetry-equivalent atom labels swapped; nonzero named RMSD is not a conformation change')
(O/'fixtures.json').write_text(json.dumps(cases,indent=2)+'\n')
print(len(cases),'fixtures generated; originals unchanged')
