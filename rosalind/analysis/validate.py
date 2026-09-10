"""Semantic contract tests in addition to JSON Schema validation."""
import copy, hashlib, json, math
from pathlib import Path
from collections import Counter
import jsonschema
import numpy as np
from Bio.PDB import PDBParser
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'rosalind'
def read(p):return json.loads((OUT/p).read_text())
def fingerprint(p):return hashlib.sha256(json.dumps(p,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()).hexdigest()
def unique(rows,key):
 vals=[r[key] for r in rows];assert len(vals)==len(set(vals)),f'duplicate {key}'
def project(p):
 jsonschema.validate(p,read('project.schema.json'))
 for table,key in [('groups','id'),('sources','id'),('candidates','id'),('sequences','id'),('methods','id'),('outcomes','assayId')]:unique(p[table],key)
 cs={c['id']:c for c in p['candidates']};ss={s['id']:s for s in p['sequences']};ms={m['id']:m for m in p['methods']};gs={g['id'] for g in p['groups']};src={s['id'] for s in p['sources']}
 for c in cs.values():assert c['sequenceId'] in ss and c['groupId'] in gs and c['sourceId'] in src
 contexts=set()
 for s in p['scores']:
  assert s['candidateId'] in cs and s['methodId'] in ms and (s['sequenceId'] is None or s['sequenceId'] in ss)
  key=(s['candidateId'],s['methodId'],s['context']);assert key not in contexts,'ambiguous score values';contexts.add(key)
  assert s['value'] is None or math.isfinite(s['value'])
  if s['value'] is not None and ms[s['methodId']]['unit']=='nM':assert s['value']>=0
 assays={o['assayId']:o for o in p['outcomes']}
 for o in assays.values():assert o['sourceId'] in src and o['groupId'] in gs
 seen=set()
 for m in p['assayMembers']:
  assert m['candidateId'] in cs and m['assayId'] in assays
  assert cs[m['candidateId']]['groupId']==assays[m['assayId']]['groupId']
  key=(m['assayId'],m['candidateId']);assert key not in seen;seen.add(key)
  if m['membership']=='exact_individual':assert assays[m['assayId']]['unitType']=='individual'
 for ex in p['exclusions']:assert ex['candidateId'] in cs
 return True

def outcome_slice(p,method_ids):
 """Return unique experimental units; fail rather than replicate a multi-row assay."""
 project(p); result={}
 excluded={x['candidateId'] for x in p['exclusions'] if 'comparison' in x['scope']}
 for o in p['outcomes']:
  if o['unitType']!='individual' or o['state'] not in ('detected','not_detected'):continue
  members=[x['candidateId'] for x in p['assayMembers'] if x['assayId']==o['assayId'] and x['membership']=='exact_individual']
  assert len(members)<=1,'Multiple candidate rows share assay: projection implementation required; evaluation disabled'
  if not members or members[0] in excluded:continue
  id=members[0]
  scorelists=[[s for s in p['scores'] if s['candidateId']==id and s['methodId']==method] for method in method_ids]
  if any(len(scores)!=1 or scores[0]['status']!='available' for scores in scorelists):continue
  key=(o['groupId'],o['experimentalUnitId'],o['endpoint'],o['timepoint'],o['restriction'])
  assert key not in result,'Duplicate experimental outcome summary';result[key]=(id,o['state'])
 return list(result.values())

def import_pack(p,request,pack,existing=None):
 jsonschema.validate(request,read('evidence-request.schema.json'));jsonschema.validate(pack,read('evidence-pack.schema.json'))
 assert request['projectId']==pack['projectId']==p['projectId']
 assert request['projectFingerprint']==pack['projectFingerprint']==fingerprint(p),'Fingerprint mismatch: explicit reconciliation required'
 assert request['requestId']==pack['requestId']
 assert set(request['selectedCandidateIds'])==set(pack['selectedCandidateIds'])
 cs={c['id']:c for c in p['candidates']};ss={s['id']:s for s in p['sequences']}
 assert len(pack['candidateContexts'])==len(pack['selectedCandidateIds'])
 for ctx in pack['candidateContexts']:
  assert ctx['candidateId'] in pack['selectedCandidateIds']
  c=cs[ctx['candidateId']];assert ctx['sequence']==ss[c['sequenceId']]['sequence'] and ctx['role']==ss[c['sequenceId']]['role'] and ctx['hla']==c['hla'],'Conflicting context'
 assert pack['candidateContexts']==request['candidateContexts'],'Reference/mapping context changed: reconcile explicitly'
 unique(pack['claims'],'id');claimids={c['id'] for c in pack['claims']}
 for f in pack['findings']:assert f['candidateId'] in pack['selectedCandidateIds'] and set(f['claimIds'])<=claimids
 for c in pack['claims']:assert set(c['candidateIds'])<=set(pack['selectedCandidateIds'])
 for c in pack['proposedCorrections']:assert c['candidateId'] in pack['selectedCandidateIds'] and not c['applyAutomatically'] and set(c['evidenceIds'])<=claimids
 stored=dict(existing or {})
 for c in pack['claims']:
  key=pack['projectFingerprint']+':'+c['id']
  if key in stored:assert stored[key]==c,'Conflicting claim content under stable ID'
  stored[key]=c
 return stored

checks=[]
def check(name,fn):fn();checks.append({'check':name,'status':'pass'})
def rejects(fn):
 try:fn()
 except (AssertionError,jsonschema.ValidationError):return
 raise AssertionError('Invalid input accepted')
r=read('fixtures/rojas.project.json');h=read('fixtures/hcc1395.project.json');hh=read('fixtures/hhat.project.json')
for p in (r,h,hh):
 check('Schema and joins: '+p['projectId'],lambda p=p:project(p))
 check('JSON lossless roundtrip: '+p['projectId'],lambda p=p: (None if json.loads(json.dumps(p))==p else (_ for _ in ()).throw(AssertionError())))
sl=outcome_slice(r,['esm','binding']);assert len(sl)==188 and Counter(v for _,v in sl)=={'detected':22,'not_detected':166};assert '10:39' not in [id for id,_ in sl];checks.append({'check':'Rojas frozen 188/22/166 and excluded 10:39','status':'pass'})
assert Counter(c['original']['outcome'] for c in r['candidates'])=={'response':23,'undetected':200,'pooled':7,'missing':2}
assert len([o for o in r['outcomes'] if o['unitType']=='pool' and o['state']=='detected'])==2
assert len([m for m in r['assayMembers'] if m['membership']=='unresolved_pool_set'])==7
assert all('assayed' not in s['role'] and s['role']!='measured_epitope' for s in r['sequences'])
assert not h['outcomes'] and not outcome_slice(h,['MHCflurry','NetMHCpan']);checks.append({'check':'232 labels, two positive pools, seven unresolved members, sequence roles; independent fixture unlabeled','status':'pass'})
bad=copy.deepcopy(r);member=next(m for m in bad['assayMembers'] if m['candidateId']=='1:3');bad['assayMembers'].append(dict(member,candidateId='1:4'));check('Reject duplicated outcome across peptide-HLA rows',lambda:rejects(lambda:outcome_slice(bad,['esm','binding'])))
bad2=copy.deepcopy(r);sc=next(s for s in bad2['scores'] if s['candidateId']=='1:3' and s['methodId']=='esm');sc.update(value=None,status='missing',missingReason='Test missingness');assert len(outcome_slice(bad2,['esm','binding']))==187;checks.append({'check':'Missing score reduces common denominator without relabeling','status':'pass'})
for label,mutation in [('missing direction',lambda p:p['methods'][0].pop('direction')),('negative nM',lambda p:p['scores'][1].update(value=-1)),('infinite score',lambda p:p['scores'][0].update(value=float('inf'))),('duplicate candidate',lambda p:p['candidates'].append(p['candidates'][0])),('unknown schema version',lambda p:p.update(schemaVersion='2.0.0'))]:
 bad=copy.deepcopy(r);mutation(bad);check('Reject '+label,lambda bad=bad:rejects(lambda:project(bad)))
request=read('fixtures/evidence-request.json');pack=read('fixtures/evidence-return.json');stored=import_pack(r,request,pack);assert stored==import_pack(r,request,pack,stored);checks.append({'check':'Exact request/return join and idempotent import; proposed correction unapplied','status':'pass'})
for label,mutation in [('fingerprint mismatch',lambda p:p.update(projectFingerprint='0'*64)),('sequence mismatch',lambda p:p['candidateContexts'][0].update(sequence='AAAAAAAAA')),('reference mismatch',lambda p:p['candidateContexts'][0].update(reference='NM_wrong.1')),('major version mismatch',lambda p:p.update(schemaVersion='2.0.0'))]:
 bad=copy.deepcopy(pack);mutation(bad);check('Reject evidence '+label,lambda bad=bad:rejects(lambda:import_pack(r,request,bad)))
m=read('mechanism.json');jsonschema.validate(m,read('evidence-pack.schema.json'));assert m['projectFingerprint']==fingerprint(hh)
assert set(m['selectedCandidateIds'])=={c['id'] for c in hh['candidates']};checks.append({'check':'HHAT mechanism uses same evidence-pack contract and separate fingerprint','status':'pass'})
# Geometry checks independent of output generation: PDB round-trip distances and known old residuals.
old=json.loads((ROOT/'public/data/structures.json').read_text())['structures'];geometry=[]
for state in m['states']:
 assert abs(state['alignment']['rmsd']-next(x for x in old if x['id']==state['id'])['platformRmsd'])<.00006
 model=PDBParser(QUIET=True).get_structure('x',ROOT/state['coordinatePath'])[0]
 sha=hashlib.sha256((ROOT/state['coordinatePath']).read_bytes()).hexdigest();assert sha==state['coordinateSha256']
 if 'w6Tyr100Alpha' in state:
  d=state['w6Tyr100Alpha']['indoleNitrogenToTyrRingCentroid'];end=d['endpoints'];centroid=np.mean([model['D'][100][a].coord for a in end[1]['atoms']],axis=0)
  assert abs(np.linalg.norm(model['C'][6]['NE1'].coord-centroid)-d['value'])<.002
  assert 3.2<d['value']<3.5
  geometry.append({'id':state['id'],'NE1ToTyrCentroid':d['value'],'minimumHeavyAtom':state['w6Tyr100Alpha']['minimumHeavyAtom']['value']})
 assert state['alignment']['count']==180
 for sasa in state['accessibility']:
  prior=next(x for x in old if x['id']==state['id'])['residues'][sasa['position']-1]['sasa']
  actual=sasa['wholeResidueComplexSasa'] if sasa['wholeResidueComplexSasa'] is not None else sasa['wholeResiduePmhcSasa'];assert abs(actual-prior)<.051
checks.append({'check':'Independent PDB roundtrip endpoints, previous HLA residuals and whole-residue SASA','status':'pass'})
for pair in m['perResidueComparisons']:assert pair['residues'][7]['sidechain']['rmsd'] is None
assert max(abs(x['rmsd']-x['sensitivity']['rmsd']) for x in m['w6Comparisons'])<.007
# Generic direction/tie semantics: fixed IDs, unchanged outcome labels.
def rank(rows,direction):return sorted(rows,key=lambda r:((1 if direction=='ascending' else -1)*r[1],r[0]))
assert rank([('b',1),('a',1),('c',2)],'ascending')==[('a',1),('b',1),('c',2)]
assert rank([('b',1),('a',1),('c',2)],'descending')==[('c',2),('a',1),('b',1)]
checks.append({'check':'Direction and stable-ID ties; no unmatched L/F sidechain RMSD; HLA sensitivity','status':'pass'})
report={'schemaVersion':'0.1.0','checks':checks,'geometry':geometry,'fixtures':{'rojasCandidates':232,'rojasEligible':188,'hcc1395Candidates':len(h['candidates']),'hcc1395Outcomes':0},'notTested':['Generic frontend, browser offline behavior, CSV import UI and ZIP safety are original-agent work.','No live researchers tested these contracts.','Whole-Workbench UI screenshots unavailable; native molecular measurements separately verified by verify_native.py.']}
(OUT/'validation.json').write_text(json.dumps(report,indent=2)+'\n');print(f'{len(checks)} checks passed')
