"""Independently enumerate deposited symmetry mates near each bound HHAT peptide."""
import itertools
import json
from pathlib import Path
import numpy as np
from Bio.PDB import PDBParser
from scipy.spatial.distance import cdist

ROOT=Path(__file__).resolve().parents[1]
results={}
for pdb in ('6UK2','6UK4'):
    raw=ROOT/f'data/raw/{pdb}.pdb'
    lines=raw.read_text().splitlines()
    c=next(l for l in lines if l.startswith('CRYST1'))
    assert all(abs(float(c[a:b])-90)<.001 for a,b in ((33,40),(40,47),(47,54)))
    cell=np.array([float(c[6:15]),float(c[15:24]),float(c[24:33])])
    ops={}
    for line in lines:
        if line.startswith('REMARK 290   SMTRY'):
            parts=line.split()
            ops.setdefault(int(parts[3]),{})[int(parts[2][-1])]=list(map(float,parts[4:8]))
    model=PDBParser(QUIET=True).get_structure(pdb,raw)[0]
    heavy=lambda atoms:np.array([a.coord for a in atoms if a.element not in ('H','D')])
    peptide=heavy(model['C'].get_atoms())
    receptor=heavy(a for chain in ('D','E') for a in model[chain].get_atoms())
    ring=np.array([a.coord for a in model['D'][100] if a.name in ('CG','CD1','CD2','CE1','CE2','CZ')]).mean(0)
    nitrogen=model['C'][6]['NE1'].coord
    candidates=[]
    for op,rows in ops.items():
        matrix=np.array([rows[i] for i in (1,2,3)])
        for lattice in itertools.product((-1,0,1),repeat=3):
            translation=matrix[:,3]+cell*np.array(lattice)
            transformed=receptor@matrix[:,:3].T+translation
            if np.linalg.norm(transformed.mean(0)-peptide.mean(0))>65:continue
            distances=cdist(peptide,transformed)
            count=int((distances<=4).sum())
            if count:
                candidates.append(dict(symmetryOperator=op,lattice=list(lattice),atomPairsWithin4A=count,
                    closestDistance=float(distances.min()),
                    Trp6Ne1ToTyr100AlphaRingCentroid=float(np.linalg.norm(ring@matrix[:,:3].T+translation-nitrogen))))
    assert len(candidates)==1,f'{pdb}: expected exactly one peptide-contacting receptor mate'
    assert candidates[0]['symmetryOperator']==1
    assert candidates[0]['lattice']==({'6UK2':[1,-1,0],'6UK4':[0,1,0]}[pdb])
    assert 3<candidates[0]['Trp6Ne1ToTyr100AlphaRingCentroid']<3.6
    results[pdb]=candidates[0]
(ROOT/'data/derived/crystal-mate-validation.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,indent=2))
