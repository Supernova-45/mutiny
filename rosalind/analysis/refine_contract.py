"""Tighten reusable measurement and structural contract; augment computed claims."""
import json
from pathlib import Path
O=Path(__file__).resolve().parents[1]
def get(n):return json.loads((O/n).read_text())
def put(n,v):(O/n).write_text(json.dumps(v,indent=2)+'\n')
s=get('evidence-pack.schema.json')
s['$defs']={
 'vec3':{'type':'array','items':{'type':'number'},'minItems':3,'maxItems':3},
 'measurement':{'type':'object','required':['state','endpoint','value','unit','uncertainty','uncertaintyType','n','censoring','missingReason'],'properties':{'state':{'type':'string'},'endpoint':{'type':'string'},'value':{'type':['number','null']},'unit':{'type':'string','minLength':1},'uncertainty':{'type':['number','null']},'uncertaintyType':{'type':['string','null']},'n':{'type':['integer','null'],'minimum':1},'censoring':{'enum':['none','lower_bound','upper_bound','not_measurable']},'missingReason':{'type':['string','null']}},'allOf':[{'if':{'properties':{'value':{'type':'null'}}},'then':{'properties':{'missingReason':{'type':'string','minLength':1}}}}]},
 'endpoint':{'type':'object','required':['chain','residue','xyz'],'properties':{'chain':{'type':'string'},'residue':{'type':'integer'},'insertionCode':{'type':'string'},'atom':{'type':'string'},'atoms':{'type':'array','items':{'type':'string'}},'xyz':{'$ref':'#/$defs/vec3'}}}}
s['properties']['claims']['items']['properties']['measurements']['items']={'$ref':'#/$defs/measurement'}
state=s['properties']['states']['items'];state['properties'].update({'id':{'type':'string'},'peptide':{'type':'string'},'allele':{'type':'string'},'chainRoles':{'type':'object','additionalProperties':{'type':'string'}},'alignment':{'type':'object','required':['selection','rotationRowVector','translation','rmsd'],'properties':{'selection':{'type':'string'},'rmsd':{'type':'number','minimum':0},'translation':{'$ref':'#/$defs/vec3'},'rotationRowVector':{'type':'array','items':{'$ref':'#/$defs/vec3'},'minItems':3,'maxItems':3}}}})
put('evidence-pack.schema.json',s)
m=get('mechanism.json');e=get('evidence.json')
for c in e['claims']:
 if c['id']=='HHAT-G1':c['measurements']=[dict(state='/'.join(x['states']),endpoint='HLA-fixed W6 matching indole atom RMSD',value=x['rmsd'],unit='angstrom',uncertainty=None,uncertaintyType=None,n=None,censoring='none',missingReason=None) for x in m['w6Comparisons']]
 if c['id']=='HHAT-G2':c['measurements']=[dict(state=x['id'],endpoint='W6 NE1 to Tyr100 alpha ring centroid',value=x['w6Tyr100Alpha']['indoleNitrogenToTyrRingCentroid']['value'],unit='angstrom',uncertainty=None,uncertaintyType=None,n=None,censoring='none',missingReason=None) for x in m['states'] if 'w6Tyr100Alpha' in x]
 # Uncertainty absence is separate from missing measurement value.
 for v in c['measurements']:
  v['uncertaintyMissingReason']=None if v['uncertainty'] is not None else ('Static coordinate precision is not an uncertainty estimate' if c['evidenceType']=='computed_geometry' else 'Not reported for this extracted value')
  if v['value'] is not None:v['missingReason']=None
put('evidence.json',e);m['claims']=e['claims'];put('mechanism.json',m)
