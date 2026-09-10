"""Summarize actual native validation pages and inspect deposited altloc records."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];O=R/'rosalind'
data=json.loads((O/'plugin-results/hhat-validation-all-states.native.json').read_text())
states=[]
for entry in ['6UJQ','6UJO','6UK2','6UK4']:
 source=R/'data/raw'/f'{entry}.pdb';lines=source.read_text().splitlines()
 residues=[]
 for pos in range(1,10):
  metrics={}
  for metric in ['rscc','rsrz','geometry']:
   matches=[]
   for receipt in data['receipts']:
    if receipt['entry']!=entry or receipt['metric']!=metric:continue
    assert receipt['result']['applied']
    qa=receipt['result']['state']['qualityAssessment']
    matches.extend(x for x in qa['page']['rows'] if x['residue']['authAsymId']=='C' and x['residue']['authSeqId']==pos and x['residue']['compId']!='HOH')
   assert len(matches)==1,(entry,pos,metric,len(matches));metrics[metric]=matches[0]
  atoms=[l for l in lines if l.startswith('ATOM  ') and l[21]=='C' and int(l[22:26])==pos]
  residues.append({'chain':'C','position':pos,'metrics':metrics,'depositedAtomCount':len(atoms),'alternateLocationLabels':sorted(set(l[16] for l in atoms)),'occupancies':sorted(set(float(l[54:60]) for l in atoms)),'atomNameAndAltloc':[{'name':l[12:16].strip(),'altloc':l[16].strip(),'occupancy':float(l[54:60])} for l in atoms]})
 receipt=next(x for x in data['receipts'] if x['entry']==entry)
 states.append({'entry':entry,'coordinatePath':str(source.relative_to(R)),'coordinateSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'coordinateFrame':'deposited Cartesian angstrom; no HLA fit applied','validationProvenance':receipt['result']['state']['qualityAssessment']['provenance'],'peptideResidues':residues})
out={'schemaVersion':'0.1.0','states':states,'density':{'available':True,'loaded':False,'visuallyInspected':False,'exported':False,'assets':[],'gridTransforms':None,'contours':None,'clipping':None,'downsampling':None,'reason':'Fresh native session and related-data probe report missing bound active workspace-read roots; no supported root-binding tool exposed; no bypass attempted.','receipt':'rosalind/plugin-results/hhat-validation-all-states.native.json','availableChannels':['2Fo-Fc','Fo-Fc'],'license':'No map asset exported; no map redistribution/license assertion made.'},'caveats':['RSCC/RSRZ describe whole residues, not side-chain certainty.','Absence of deposited alternate conformers does not rule out disorder or alternative conformations.','Per-structure resolution, refinement and crystallization differ; do not treat metric differences as mutation effects.','No density map inspected; validation metrics cannot substitute for viewing maps.','Geometry issue count zero only means no reported mapped issue types.']}
(O/'experimental-support.json').write_text(json.dumps(out,indent=2)+'\n')
for s in states:
 print(s['entry'],[(r['position'],r['metrics']['rscc']['value'],r['metrics']['rsrz']['value'],r['alternateLocationLabels']) for r in s['peptideResidues'] if r['position'] in [6,8]])
