"""Generate proposed normalized contracts and source adapters; no frontend or scoring."""
import csv, hashlib, json
from pathlib import Path
import openpyxl
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'rosalind'
def write(name,x):
 p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,indent=2,allow_nan=False)+'\n')
def digest(x):return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()).hexdigest()
def filehash(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def obj(props,required=None):return {'type':'object','properties':props,'required':list(props) if required is None else required,'additionalProperties':False}
def arr(x):return {'type':'array','items':x}
s={'type':'string','minLength':1}; ns={'type':['string','null']};num={'type':['number','null']}; free={'type':'object'}
idref=s;hashschema={'type':'string','pattern':'^[0-9a-f]{64}$'}
source=obj({'id':s,'url':s,'sha256':hashschema,'path':s,'license':ns})
seq=obj({'id':s,'sequence':{'type':'string','pattern':'^[ACDEFGHIKLMNPQRSTVWYXBZUO*]+$'},'role':{'enum':['mutant_source_context','wildtype_source_context','predicted_epitope','measured_epitope','reference_protein']},'reference':ns,'mapping':{'type':['object','null']}})
candidate=obj({'id':s,'groupId':s,'sequenceId':s,'targetId':ns,'variantId':ns,'peptideHlaId':ns,'hla':ns,'gene':ns,'sourceId':s,'sourceRow':{'type':'integer','minimum':2},'original':free})
method=obj({'id':s,'endpoint':s,'unit':s,'direction':{'enum':['ascending','descending']},'version':s,'versionStatus':{'enum':['known','not_reported']},'sourceId':s,'semantics':s})
score=obj({'candidateId':s,'methodId':s,'value':num,'status':{'enum':['available','missing','unresolved']},'missingReason':ns,'sequenceId':ns,'hla':ns,'context':s})
score['allOf']=[{'if':{'properties':{'status':{'const':'available'}}},'then':{'properties':{'value':{'type':'number'},'missingReason':{'type':'null'}}},'else':{'properties':{'value':{'type':'null'},'missingReason':s}}}]
outcome=obj({'assayId':s,'experimentalUnitId':s,'groupId':s,'state':{'enum':['detected','not_detected','pooled_unresolved','not_tested','missing','unresolved']},'unitType':{'enum':['individual','pool','unresolved_pool_set']},'endpoint':s,'timepoint':ns,'restriction':ns,'sourceId':s,'sourceLocation':s,'notes':s})
member=obj({'assayId':s,'candidateId':s,'membership':{'enum':['exact_individual','known_pool_member','unresolved_pool_set']}})
base={'schemaVersion':{'const':'0.1.0'},'projectId':s,'title':s,'analysisUnit':{'enum':['administered_target','peptide','peptide_hla','variant']},'groups':arr(obj({'id':s,'label':s})),'sources':arr(source),'candidates':arr(candidate),'sequences':arr(seq),'methods':arr(method),'scores':arr(score),'outcomes':arr(outcome),'assayMembers':arr(member),'exclusions':arr(obj({'candidateId':s,'scope':s,'reason':s})),'annotations':arr(free),'view':free,'analysisConfig':obj({'projectionRule':ns,'endpoint':ns,'timepoint':ns,'restriction':ns,'trainingSelectionHistory':s}),'transformation':obj({'script':s,'losses':arr(s),'notes':s})}
project=obj(base);project.update({'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://supernova-45.github.io/mutiny/schemas/project/0.1.0','title':'Proposed portable project: normalized JSON equivalent of TSV tables'})
write('project.schema.json',project)
finding=obj({'candidateId':s,'status':{'enum':['resolved','unresolved','unsupported']},'claimIds':arr(s),'reason':ns},['candidateId','status','claimIds'])
correction=obj({'id':s,'candidateId':s,'field':s,'current':{},'proposed':{},'reason':s,'evidenceIds':arr(s),'applyAutomatically':{'const':False}})
packprops={'schemaVersion':{'const':'0.1.0'},'packId':s,'projectId':s,'projectFingerprint':hashschema,'requestId':ns,'selectedCandidateIds':arr(s),'findings':arr(finding),'proposedCorrections':arr(correction),'unsupported':arr(obj({'task':s,'reason':s})),'provenance':free,'coordinateFrame':free,'atomPolicy':s,'sasaMethod':s,'states':arr(free),'perResidueComparisons':arr(free),'w6Comparisons':arr(free),'displaySelections':free,'claims':arr(free),'candidateContexts':arr(obj({'candidateId':s,'sequence':s,'role':s,'hla':ns,'reference':ns,'mappingStatus':{'enum':['verified','unresolved','not_requested']}}))}
pack=obj(packprops,['schemaVersion','packId','projectId','projectFingerprint','requestId','selectedCandidateIds','findings','proposedCorrections','unsupported','provenance','candidateContexts','claims'])
pack.update({'$schema':project['$schema'],'title':'Portable evidence return; structural extension optional'})
# Structural extension is generic: states require measured/predicted provenance and a coordinate frame.
pack['properties']['states']['items']={'type':'object','required':['id','structureType','sourceUrl','sha256','peptide','allele','chainRoles','coordinatePath','coordinateSha256','alignment'],'properties':{'structureType':{'enum':['measured','predicted']},'sha256':hashschema,'coordinateSha256':hashschema,'alignment':{'type':'object','required':['selection','rotationRowVector','translation','rmsd']}}}
pack['allOf']=[{'if':{'required':['states']},'then':{'required':['coordinateFrame'],'properties':{'coordinateFrame':{'type':'object','required':['id','unit','reference','convention','uncertainty']}}}}]
pack['properties']['claims']['items']={'type':'object','required':['id','claim','evidenceType','sourceUrl','location','measurements','limitations','candidateIds'],'properties':{'evidenceType':{'enum':['published_experiment','computed_geometry','interpretation','model_prediction']},'measurements':{'type':'array'},'limitations':arr(s)}}
write('evidence-pack.schema.json',pack)
req=obj({'schemaVersion':{'const':'0.1.0'},'requestId':s,'projectId':s,'projectFingerprint':hashschema,'selectedCandidateIds':arr(s),'candidateContexts':packprops['candidateContexts'],'questions':arr(s),'permissibleSources':arr(source)})
req.update({'$schema':project['$schema'],'title':'Explicit selected-subset evidence request'})
write('evidence-request.schema.json',req)

def blank(id,title,unit,sources):return {'schemaVersion':'0.1.0','projectId':id,'title':title,'analysisUnit':unit,'groups':[],'sources':sources,'candidates':[],'sequences':[],'methods':[],'scores':[],'outcomes':[],'assayMembers':[],'exclusions':[],'annotations':[],'view':{'seed':20260909,'outcomesVisible':False},'analysisConfig':{'projectionRule':None,'endpoint':None,'timepoint':None,'restriction':None,'trainingSelectionHistory':'Unknown; no independence certification'},'transformation':{'script':'rosalind/analysis/contracts.py','losses':[],'notes':''}}
def addseq(p,id,sequence,role,ref=None,mapping=None):
 if sequence:p['sequences'].append(dict(id=id,sequence=sequence,role=role,reference=ref,mapping=mapping));return id
 return None
cohort=json.loads((ROOT/'public/data/cohort.json').read_text()); targets=cohort['targets']
raw=ROOT/'data/raw/rojas-2023-table5.xlsx'
rows=[r for r in list(openpyxl.load_workbook(raw,read_only=True,data_only=True).active.values)[1:] if r[0]]
assert len(rows)==len(targets)==232
labels={'De novo response':'response','No response':'undetected','De novo response in pool':'pooled','No data':'missing'}
for row,t in zip(rows,targets):
 assert f'{row[0]}:{row[1]}'==t['id'] and labels[row[14]]==t['outcome'] and all(row[i] for i in (8,9,11,12))
p=blank('rojas-2023','Rojas administered pancreatic vaccine targets','administered_target',[dict(id='rojas-table5',url=cohort['source'],sha256=filehash(raw),path='data/raw/rojas-2023-table5.xlsx',license='Existing repository public publication supplement; preserve source terms'),dict(id='frozen-scores',url='https://github.com/Supernova-45/mutiny',sha256=filehash(ROOT/'public/data/cohort.json'),path='public/data/cohort.json',license='Existing repository terms')])
p['groups']=[dict(id=str(x),label=f'Published patient {x}') for x in sorted(set(t['patient'] for t in targets))]
p['methods']=[dict(id='esm',endpoint='masked mutant minus WT log probability',unit='natural_log_ratio',direction='ascending',version='facebook/esm2_t33_650M_UR50D@08e4846e537177426273712802403f7ba8261b6c',versionStatus='known',sourceId='frozen-scores',semantics='Frozen existing score on verified WT protein window; exploratory disruption ordering'),dict(id='binding',endpoint='predicted class-I binding affinity',unit='nM',direction='ascending',version='MHCflurry 2.1.4 models_class1_pan 20200610',versionStatus='known',sourceId='frozen-scores',semantics='Published best class-I epitope/allele input; not experimental response restriction')]
for i,t in enumerate(targets,2):
 id=t['id'];sid=addseq(p,id+':mutant-context',t['mutant'],'mutant_source_context');addseq(p,id+':wt-context',t['wildtype'],'wildtype_source_context')
 ep1=addseq(p,id+':class-I-prediction',t['epitope1'],'predicted_epitope');addseq(p,id+':class-II-prediction',t['epitope2'],'predicted_epitope')
 mapping=t['proteinMapping'];protein=None
 if mapping and mapping.get('status')=='verified':protein=addseq(p,id+':reference',mapping['protein'],'reference_protein',mapping['proteinAccession'],mapping)
 p['candidates'].append(dict(id=id,groupId=str(t['patient']),sequenceId=sid,targetId=id,variantId=f'{t["transcript"]}:{t["mutation"]}',peptideHlaId=None,hla=None,gene=t['gene'],sourceId='rojas-table5',sourceRow=i,original=t))
 for method,scseq,hla in [('esm',protein,None),('binding',ep1,t['hla1'])]:
  val=t[method];p['scores'].append(dict(candidateId=id,methodId=method,value=val,status='available' if val is not None else 'missing',missingReason=None if val is not None else 'Strict reference mapping unavailable; existing score retained as missing',sequenceId=scseq,hla=hla,context='frozen-published-target-projection'))
 state={'response':'detected','undetected':'not_detected','pooled':'pooled_unresolved','missing':'missing'}[t['outcome']]
 if state!='pooled_unresolved':
  aid='ELISpot:'+id;p['outcomes'].append(dict(assayId=aid,experimentalUnitId=id,groupId=str(t['patient']),state=state,unitType='individual',endpoint='published post-vaccine ELISpot target response',timepoint=None,restriction=None,sourceId='rojas-table5',sourceLocation=f'Supplementary Table 5 row {i}',notes='Table categorical summary; responding HLA class and exact assayed epitope not inferred.'))
  p['assayMembers'].append(dict(assayId=aid,candidateId=id,membership='exact_individual'))
 if not t['comparisonEligible']:p['exclusions'].append(dict(candidateId=id,scope='frozen joint response comparison',reason='Pooled or missing outcome' if t['outcome'] in ('pooled','missing') else 'No strictly reconciled ESM score'))
# Two positive pools remain two experimental units; neither membership assignment is known.
for j in (1,2):p['outcomes'].append(dict(assayId=f'patient25:reported-pool-{j}',experimentalUnitId=f'patient25:reported-pool-{j}',groupId='25',state='detected',unitType='pool',endpoint='published post-vaccine ELISpot pool response',timepoint=None,restriction=None,sourceId='rojas-table5',sourceLocation='Rojas Figure 1 and Supplementary Table 5 pooled labels',notes='Local identifiers for two reported pools, not published pool names; member assignment unknown.'))
p['outcomes'].append(dict(assayId='patient25:unresolved-pool-set',experimentalUnitId='patient25:unresolved-pool-set',groupId='25',state='pooled_unresolved',unitType='unresolved_pool_set',endpoint='unresolved membership of two positive ELISpot pools',timepoint=None,restriction=None,sourceId='rojas-table5',sourceLocation='Seven pooled rows in Supplementary Table 5',notes='Membership set is not a third assay; no individual positive or negative assigned.'))
for t in targets:
 if t['outcome']=='pooled':p['assayMembers'].append(dict(assayId='patient25:unresolved-pool-set',candidateId=t['id'],membership='unresolved_pool_set'))
p['analysisConfig'].update(projectionRule='One published target summary; ESM from verified source context and MHCflurry from published best class-I pair. Never propagate outcome onto peptide-HLA rows.',endpoint='published post-vaccine ELISpot target response',trainingSelectionHistory='Already selected/administered cohort; frozen scores reused, no new training or rescore')
p['transformation'].update(notes='All original cohort fields preserved in candidates.original. Mutant flank is source context, not assayed epitope. Two positive pool assays retained separately; membership unresolved.',losses=['No new information inferred: exact assay peptide, responding HLA class, precise assay timepoint, and individual pool assignments remain unknown.'])
write('fixtures/rojas.project.json',p)
# Independent public unlabeled fixture. Stable IDs derive from immutable biological context, not row order.
commit='c76ea9d26d549d479affe9ce31f551295fadcde7';path=OUT/'fixtures/sources/HCC1395.filtered.tsv';url=f'https://raw.githubusercontent.com/griffithlab/pVACtools/{commit}/pvactools/tools/pvacseq/example_data/results/MHC_Class_I/HCC1395_TUMOR_DNA.MHC_I.filtered.tsv'
h=blank('hcc1395-pvacseq-filtered','HCC1395 published pVACtools demonstration, unlabeled','peptide_hla',[dict(id='pvac-demo',url=url,sha256=filehash(path),path='rosalind/fixtures/sources/HCC1395.filtered.tsv',license='BSD-3-Clause-Clear; see sources/pvactools-LICENSE')]);h['groups']=[dict(id='HCC1395',label='HCC1395 tumor cell line')]
for name in ['MHCflurry','NetMHCpan']:
 h['methods'].append(dict(id=name,endpoint='predicted peptide-HLA IC50',unit='nM',direction='ascending',version='not reported in table; artifact commit '+commit,versionStatus='not_reported',sourceId='pvac-demo',semantics='Supplied prediction column, no rerun; underlying predictor/model revision not certified'))
for rownum,r in enumerate(csv.DictReader(path.open(),delimiter='\t'),2):
 identity=[r[x] for x in ['Chromosome','Start','Stop','Reference','Variant','Transcript','HLA Allele','MT Epitope Seq','Sub-peptide Position']];id='hcc:'+digest(identity)[:20]
 sid=addseq(h,id+':mutant',r['MT Epitope Seq'],'predicted_epitope',r['Transcript']);addseq(h,id+':normal',r['WT Epitope Seq'],'predicted_epitope',r['Transcript'])
 variant=':'.join(r[x] for x in ['Chromosome','Start','Stop','Reference','Variant'])
 h['candidates'].append(dict(id=id,groupId='HCC1395',sequenceId=sid,targetId=None,variantId=variant,peptideHlaId=id,hla=r['HLA Allele'],gene=r['Gene Name'],sourceId='pvac-demo',sourceRow=rownum,original=r))
 for name in ['MHCflurry','NetMHCpan']:
  val=r[name+' MT IC50 Score'];available=val not in ('NA','')
  h['scores'].append(dict(candidateId=id,methodId=name,value=float(val) if available else None,status='available' if available else 'missing',missingReason=None if available else 'Source NA',sequenceId=sid,hla=r['HLA Allele'],context='source-filtered-class-I-pair'))
h['transformation'].update(losses=['Only two prediction columns normalized; all original columns retained as strings and raw TSV retained.','Filtered class-I demonstration only, not full pVACseq aggregated/metrics adapter.','Underlying predictor versions not provided by this table.'],notes='No outcomes supplied or fabricated; no clinical or immunogenicity validation. Transcript identity retained, no reference reconciliation performed.')
write('fixtures/hcc1395.project.json',h)
# Exact request/return from selected Rojas candidates; includes unresolved reference and semantic correction.
selected=['1:3','10:39'];contexts=[]
for id in selected:
 c=next(t for t in targets if t['id']==id);contexts.append(dict(candidateId=id,sequence=c['mutant'],role='mutant_source_context',hla=None,reference=c['transcript'],mappingStatus='unresolved' if id=='10:39' else 'verified'))
request=dict(schemaVersion='0.1.0',requestId='rojas-evidence-request-1',projectId=p['projectId'],projectFingerprint=digest(p),selectedCandidateIds=selected,candidateContexts=contexts,questions=['Confirm sequence role and reference reconciliation without rescoring.'],permissibleSources=p['sources'])
write('fixtures/evidence-request.json',request)
claim=dict(id='ROJAS-ROLE-1',claim='Supplied mutant flank is source context; class-I and class-II predicted epitopes are separate fields.',evidenceType='computed_geometry',sourceUrl=cohort['source'],location='Supplementary Table 5 columns F, J, M; local exact source cross-check',measurements=[],limitations=['Schema evidence type extended below to computed validation; no structural claim.'],candidateIds=['1:3'])
# Use a type that explicitly covers non-geometric computation.
pack['properties']['claims']['items']['properties']['evidenceType']['enum'].append('computed_validation');write('evidence-pack.schema.json',pack);claim['evidenceType']='computed_validation'
response=dict(schemaVersion='0.1.0',packId='rojas-evidence-return-1',projectId=p['projectId'],projectFingerprint=digest(p),requestId=request['requestId'],selectedCandidateIds=selected,candidateContexts=contexts,findings=[dict(candidateId='1:3',status='resolved',claimIds=['ROJAS-ROLE-1']),dict(candidateId='10:39',status='unresolved',claimIds=[],reason='Strict current-reference mismatch remains; historical rescue not performed')],claims=[claim],proposedCorrections=[dict(id='proposal-role-label-1',candidateId='1:3',field='displayLabel for primary sequence',current='unspecified',proposed='Mutant source context',reason='Prevent importer from labeling the flank as an assayed epitope; presentation-only proposal, existing role is already correct',evidenceIds=['ROJAS-ROLE-1'],applyAutomatically=False)],unsupported=[],provenance=dict(execution='local source cross-check',script='rosalind/analysis/contracts.py'))
write('fixtures/evidence-return.json',response)
# Mechanism is an instance of same portable contract, bound to its own two-candidate project.
m=json.loads((OUT/'mechanism.json').read_text()); hp=blank('hhat-structural-case','Ovarian HHAT structural comparison','peptide_hla',[]);hp['groups']=[dict(id='HHAT',label='Separate structural case')]
for n,(id,sequence,pdb) in enumerate([('HHAT:L75','KQWLVWLLL','6UJQ'),('HHAT:L75F','KQWLVWLFL','6UJO')],2):
 state=next(s for s in m['states'] if s['id']==pdb);hp['sources'].append(dict(id=pdb,url=state['sourceUrl'],sha256=state['sha256'],path=state['inputPath'],license='wwPDB public archive'))
 sid=addseq(hp,id+':peptide',sequence,'measured_epitope');hp['candidates'].append(dict(id=id,groupId='HHAT',sequenceId=sid,targetId=None,variantId=id,peptideHlaId=id,hla='HLA-A*02:06',gene='HHAT',sourceId=pdb,sourceRow=n,original={'sourceLocation':'PDB chain C; row number is adapter entry, not PDB line'}))
hp['transformation']['notes']='Two HHAT peptide-HLA identities, distinct from vaccine cohort; sourceRow is adapter entry.'
write('fixtures/hhat.project.json',hp)
m['projectFingerprint']=digest(hp);m['candidateContexts']=[dict(candidateId=c['id'],sequence=next(s['sequence'] for s in hp['sequences'] if s['id']==c['sequenceId']),role='measured_epitope',hla=c['hla'],reference=None,mappingStatus='verified') for c in hp['candidates']];m['claims']=json.loads((OUT/'evidence.json').read_text())['claims'];write('mechanism.json',m)
print('Normalized',len(p['candidates']),'Rojas and',len(h['candidates']),'independent HCC1395 candidate rows; HHAT separately.')
