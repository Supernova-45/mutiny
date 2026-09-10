"""Generate explicitly versioned proposal schemas; never edit the 0.1.0 schemas."""
from pathlib import Path
import json,copy
O=Path(__file__).resolve().parent
old=json.loads((O.parent/'project.schema.json').read_text())
def obj(p):return {'type':'object','properties':p,'required':list(p),'additionalProperties':False}
def arr(p):return {'type':'array','items':p}
s={'type':'string','minLength':1};h={'type':'string','pattern':'^[0-9a-f]{64}$'};free={'type':'object'}
v={'const':'0.2.0'};profile={'const':'mutiny-canonical-json-1'}
science=copy.deepcopy(old)
for k in ['$id','$schema','title']:science.pop(k,None)
for k in ['schemaVersion','title','annotations','view']:
 science['properties'].pop(k);science['required'].remove(k)
base={'schemaVersion':v,'identityProfile':profile,'projectId':s,'scientificDigest':h}
project=obj({**base,'scientificData':science,'reviewState':obj({'title':s,'annotations':arr(free),'view':free,'notes':arr(free),'proposedCorrections':arr(free)}),'migration':obj({'fromVersion':{'const':'0.1.0'},'originalCanonicalDigest':h,'policy':{'const':'explicit-copy-v1'}})})
ctx=obj({'candidateId':s,'candidate':old['properties']['candidates']['items'],'sequences':old['properties']['sequences'],'methods':old['properties']['methods'],'scores':old['properties']['scores'],'sources':old['properties']['sources']})
ids={'type':'array','items':s,'minItems':1,'uniqueItems':True}
request=obj({**base,'requestId':s,'contextDigest':h,'selectedCandidateIds':ids,'contexts':{'type':'array','items':ctx,'minItems':1},'questions':{'type':'array','items':s,'minItems':1},'requestDigest':h})
finding=obj({'candidateId':s,'status':{'enum':['resolved','unresolved','no_exact_match','unsupported']},'claimIds':{'type':'array','items':s,'uniqueItems':True},'reason':s,'searchScope':free});finding['required']=['candidateId','status','claimIds']
claim=obj({'id':s,'candidateIds':ids,'evidenceLevel':{'enum':['fixture_identity','exact_experimental','related_context']},'claim':s,'sources':{'type':'array','minItems':1,'items':free},'details':free,'limitations':arr(s)});claim['required'].remove('details')
correction=obj({'id':s,'candidateId':s,'field':s,'current':{},'proposed':{},'reason':s,'evidenceIds':arr(s),'applyAutomatically':{'const':False}})
response=obj({**base,'returnId':s,'requestId':s,'requestDigest':h,'contextDigest':h,'selectedCandidateIds':ids,'findings':arr(finding),'claims':arr(claim),'proposedCorrections':arr(correction),'returnDigest':h})
for name,schema in [('project',project),('request',request),('return',response)]:
 schema.update({'$schema':'https://json-schema.org/draft/2020-12/schema','$id':f'https://supernova-45.github.io/mutiny/proposals/exchange/0.2.0/{name}','title':f'Proposed 0.2.0 {name}; not a reinterpretation of 0.1.0'})
 (O/(name+'.schema.json')).write_text(json.dumps(schema,indent=2)+'\n')
