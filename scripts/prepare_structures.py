"""Align experimental complexes on HLA platform CA atoms; export real coordinates.

No peptide fitting or morphing. Contacts mean heavy-atom distances <= 4 Angstrom,
not inferred bonds or energetic interactions. SASA uses a 1.4 Angstrom probe.
"""
import hashlib
import json
from pathlib import Path
import numpy as np
from Bio.PDB import PDBParser, ShrakeRupley
from Bio.SeqUtils import seq1

ROOT=Path(__file__).resolve().parents[1]
IDS={'6UJQ':('normal',False),'6UJO':('mutant',False),'6UK2':('normal',True),'6UK4':('mutant',True)}
parser=PDBParser(QUIET=True)
models={p:parser.get_structure(p,ROOT/f'data/raw/{p}.pdb')[0] for p in IDS}
reference=models['6UJQ']
def platform(model):
    return {r.id[1]:r['CA'].coord for r in model['A'] if r.id[0]==' ' and 1<=r.id[1]<=180 and 'CA' in r}
ref=platform(reference)
origin=np.mean([a.coord for a in reference['C'].get_atoms()],axis=0)
x=reference['C'][9]['CA'].coord-reference['C'][1]['CA'].coord
x=x/np.linalg.norm(x)
z=origin-np.mean(list(ref.values()),axis=0)
z=z-np.dot(z,x)*x; z=z/np.linalg.norm(z)
y=np.cross(z,x)
# Look down onto the platform, with some depth so the surface remains legible.
basis=np.stack([x,y,z],axis=1)
angle=np.deg2rad(-25)
tilt=np.array([[1,0,0],[0,np.cos(angle),-np.sin(angle)],[0,np.sin(angle),np.cos(angle)]])
basis=basis@tilt
manifest=[]
for pdb,(state,bound) in IDS.items():
    model=models[pdb];moving=platform(model);common=sorted(set(ref)&set(moving))
    # The TCR and pMHC are deposited in separate translated unit cells. Recover
    # the contacting crystal mate using the deposited orthorhombic cell, identity
    # rotation, and an integer lattice translation. No fitted receptor docking.
    lattice={'6UK2':(1,-1,0),'6UK4':(0,1,0)}.get(pdb,(0,0,0))
    cryst=next(l for l in (ROOT/f'data/raw/{pdb}.pdb').read_text().splitlines() if l.startswith('CRYST1'))
    cell=np.array([float(cryst[6:15]),float(cryst[15:24]),float(cryst[24:33])])
    shift=cell*np.array(lattice)
    if bound:
        for chain in ('D','E'):
            for atom in model[chain].get_atoms(): atom.set_coord(atom.coord+shift)
    a=np.array([moving[k] for k in common]);b=np.array([ref[k] for k in common])
    ac=a.mean(axis=0);bc=b.mean(axis=0)
    u,_,vt=np.linalg.svd((a-ac).T@(b-bc))
    correction=np.eye(3);correction[2,2]=np.linalg.det(u@vt)
    rotation=u@correction@vt
    rmsd=float(np.sqrt(np.mean(np.sum(((a-ac)@rotation+bc-b)**2,axis=1))))
    peptide=''.join(seq1(r.resname) for r in model['C'] if r.id[0]==' ')
    expected='KQWLVWLLL' if state=='normal' else 'KQWLVWLFL'
    if peptide!=expected:raise ValueError(f'{pdb}: unexpected peptide {peptide}')
    # Measure SASA on protein atoms only, removing crystallographic waters/ligands.
    for chain in list(model):
        for res in list(chain):
            if res.id[0]!=' ':chain.detach_child(res.id)
    ShrakeRupley(probe_radius=1.4,n_points=200).compute(model,level='R')
    residues=[]
    receptors=[a for c in model if c.id in ('D','E') for a in c.get_atoms() if a.element not in ('H','D')]
    for residue in model['C']:
        contacts={}
        for atom in residue:
            if atom.element in ('H','D'):continue
            for other in receptors:
                distance=float(np.linalg.norm(atom.coord-other.coord))
                if distance<=4:
                    key=f'{other.parent.parent.id}:{other.parent.resname}{other.parent.id[1]}'
                    if key not in contacts or distance<contacts[key]['distance']:
                        contacts[key]={'residue':key,'distance':round(distance,2),'peptideAtom':atom.name,'receptorAtom':other.name}
        residues.append({'position':residue.id[1],'name':seq1(residue.resname),'sasa':round(residue.sasa,1),'contacts':list(contacts.values())})
    lines=[]
    for line in (ROOT/f'data/raw/{pdb}.pdb').read_text().splitlines():
        if not line.startswith('ATOM') or line[16] not in (' ','A'):continue
        coord=np.array([float(line[30:38]),float(line[38:46]),float(line[46:54])])
        if line[21] in ('D','E'):coord=coord+shift
        coord=((coord-ac)@rotation+bc-origin)@basis
        lines.append(line[:30]+''.join(f'{n:8.3f}' for n in coord)+line[54:])
    text='\n'.join(lines)+'\nEND\n'
    (ROOT/f'public/structures/{pdb}.pdb').write_text(text)
    manifest.append(dict(id=pdb,state=state,bound=bound,peptide=peptide,allele='HLA-A*02:06',
        source=f'https://www.rcsb.org/structure/{pdb}',rawSha256=hashlib.sha256((ROOT/f'data/raw/{pdb}.pdb').read_bytes()).hexdigest(),
        alignedSha256=hashlib.sha256(text.encode()).hexdigest(),platformRmsd=round(rmsd,4),alignedCaCount=len(common),
        receptorLatticeTranslation=list(lattice),receptorTranslationAngstrom=shift.tolist(),residues=residues))
output=dict(structures=manifest,alignment='Kabsch fit on common HLA chain A CA atoms, residues 1–180; common display rotation',
    sasa='Shrake–Rupley, 1.4 Å probe, 200 points/atom, protein-only complex',contacts='Heavy-atom pairs within 4 Å; unique TCR residues per peptide residue',
    receptorAssembly='TCR chains D/E translated by deposited unit-cell vectors: 6UK2 (+a,-b,0); 6UK4 (0,+b,0). Identity symmetry rotation. Each is the only peptide-contacting mate among identity and deposited symmetry operations with translations -1..1. Checked against the paper\'s Trp6–Tyr100α interface.',
    study='Devlin et al., Nature Chemical Biology 2020',doi='10.1038/s41589-020-0610-1')
(ROOT/'public/data/structures.json').write_text(json.dumps(output,indent=2)+'\n')
print([(s['id'],s['peptide'],s['platformRmsd']) for s in manifest])
