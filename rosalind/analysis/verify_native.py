"""Validate retained native measurements against source-bound prepared coordinates.

This replays the independent numerical checks, not a live viewer or an image render.
Native MCP receipts are immutable inputs; all sources are hashed in manifest.json.
"""
from pathlib import Path
import hashlib, json
import numpy as np
from Bio.PDB import PDBParser

O=Path(__file__).resolve().parents[1]
def read(p): return json.loads((O/p).read_text())
def write(p,x): (O/p).write_text(json.dumps(x,indent=2)+'\n')
r=read('plugin-results/hhat-native-measurements.json')
ids=read('plugin-results/hhat-native-atom-identities.json')
models={k:PDBParser(QUIET=True).get_structure(k,O.parent/p)[0] for k,p in r['objects'].items()}
lookup={x['id']:x for rows in ids.values() for x in rows}
def coord(atom_id):
 x=lookup[atom_id]
 return models[x['objectId']][x['chain']][(' ',x['residueNumber'],x['insertionCode'] or ' ')][x['atomName']].coord.astype(float)
checks=[]
for row in r['fixedFrameAtomDistances']:
 m=row['result']['state']['measurement']
 assert row['result']['applied'] and all(x['sourceAtomCount']==1 for x in m['resolvedTargets'])
 value=float(np.linalg.norm(coord(m['atomIds'][0])-coord(m['atomIds'][1])))
 assert abs(value-m['value'])<2e-5
 checks.append({'reference':row['reference'],'mobile':row['mobile'],'nativeAngstrom':m['value'],'independentAngstrom':value,'absoluteToleranceAngstrom':2e-5})
a=r['contacts']['state']['analysis']
assert a['resultsComplete'] and a['resultCount']==8 and not a['truncated']
for row in a['rows']:
 v=float(np.linalg.norm(coord(row['firstAtomId'])-coord(row['secondAtomId'])))
 assert abs(v-row['distanceAngstrom'])<2e-5 and v<=4
 assert lookup[row['firstAtomId']]['residueNumber']==6
 assert lookup[row['secondAtomId']]['residueNumber']==100
# Native contacts use internal residue indices in display strings; atom queries
# independently map their exact atom IDs back to author C6 and D100.
distance_values=sorted(float(np.linalg.norm(x.coord.astype(float)-y.coord.astype(float))) for x in models['primary']['C'][6] for y in models['primary']['D'] .get_atoms() if float(np.linalg.norm(x.coord.astype(float)-y.coord.astype(float)))<=4)
assert len(distance_values)==8
assert np.allclose(distance_values,sorted(x['distanceAngstrom'] for x in a['rows']),atol=2e-5,rtol=0)
for stem in ['hhat-native-interface','hhat-native-four-state']:
 p=O/'plugin-results'/f'{stem}.png'
 metadata=read(f'plugin-results/{stem}.png.render.json')
 assert hashlib.sha256(p.read_bytes()).hexdigest()==metadata['artifact']['sha256']
 assert metadata['provenance']['renderer']=='Mol* 5.11.0'
verification={'status':'pass','fixedFrameChecks':checks,'nativeContacts':8,'authorResidues':['C:6','D:100'],'nativeRenderHashesVerified':2,'limitations':['PDB coordinates rounded to 0.001 angstrom; tolerance allows float32 arithmetic.','Native RMSD refits selected ring atoms; it is not the fixed-HLA displacement.','Multi-atom distance tool uses closest pair, not centroids.','No trajectory, free energy, or statistical coordinate uncertainty computed.']}
write('plugin-results/hhat-native-verification.json',verification)
m=read('mechanism.json')
m['provenance']['nativeVerification']={'plugin':'Molecular Structure Viewer 0.1.80','receipt':'rosalind/plugin-results/hhat-native-measurements.json','verification':'rosalind/plugin-results/hhat-native-verification.json','nativeCsv':'rosalind/plugin-results/hhat-native-results.csv','nativeImages':['rosalind/plugin-results/hhat-native-interface.png','rosalind/plugin-results/hhat-native-four-state.png'],'scope':'Native atom-distance/contact measurements on independently reconstructed HLA-aligned inputs; local full-precision geometry remains separately attributed.'}
m['unsupported']=[{'task':'Screenshot of surrounding Rosalind Workbench UI','reason':'Native molecular PNG renders succeeded; Computer Use access to Codex host denied. Render is not a screenshot of surrounding UI.'},{'task':'Completed Sequence Viewer analysis/export','reason':'Records mounted and query succeeded; alignment queued but completion/query/export could not apply.'}]
write('mechanism.json',m)
e=read('evidence.json')
for claim in e['claims']:
 if claim['id'] in ['HHAT-G1','HHAT-G2']:
  claim['nativeVerification']=m['provenance']['nativeVerification']
e['provenance']['nativeGeometryVerification']='Molecular Structure Viewer receipts supplement G1/G2; published assays remain literature evidence.'
write('evidence.json',e)
print('Native verification passed: four fixed-frame atom distances, eight complete contacts, two render hashes')
