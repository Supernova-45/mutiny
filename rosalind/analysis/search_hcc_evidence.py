"""Execute installed Life Sciences Literature PubMed searches for three public fixture rows."""
import json,subprocess,sys,time,datetime
from pathlib import Path
R=Path(__file__).resolve().parents[2];O=R/'rosalind/roundtrip-v0.2';O.mkdir(exist_ok=True)
P=json.loads((R/'rosalind/fixtures/hcc1395.project.json').read_text())
script=Path(sys.argv[1])/'skills/ncbi-entrez-skill/scripts/ncbi_entrez.py'
queries=[]
for i,c in enumerate(P['candidates'][:3]):
 o=c['original'];queries.extend([(f'candidate-{i+1}-peptide',c['id'],'exact_peptide',f'"{o["MT Epitope Seq"]}"[All Fields]'),(f'candidate-{i+1}-variant',c['id'],'variant_context',f'{c["gene"]}[All Fields] AND ("{o["HGVSp"].split(":")[-1]}"[All Fields] OR "{o["HGVSc"].split(":")[-1]}"[All Fields])')])
queries.append(('hcc1395-context',None,'related_cell_line_context','HCC1395[All Fields] AND (neoantigen[All Fields] OR pVACtools[All Fields])'))
receipts=[]
if '--fetch-only' in sys.argv:
 queries=[]
 receipts=json.loads((O/'search-log.json').read_text())
for name,cid,scope,term in queries:
 raw=O/(name+'.raw.json');req={'endpoint':'esearch','params':{'db':'pubmed','term':term,'retmode':'json','retmax':10},'max_items':10,'save_raw':True,'raw_output_path':str(raw)}
 p=subprocess.run([sys.executable,str(script)],input=json.dumps(req),text=True,capture_output=True)
 (O/(name+'.plugin.json')).write_text(p.stdout)
 try:out=json.loads(p.stdout)
 except ValueError:out={'ok':False,'error':p.stderr}
 entry={'name':name,'candidateId':cid,'scope':scope,'query':term,'queriedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'database':'PubMed','retmax':10,'plugin':'Life Sciences Literature 0.1.5 / ncbi_entrez.py','exitCode':p.returncode,'ok':out.get('ok',False),'receipt':f'rosalind/roundtrip-v0.2/{name}.plugin.json','raw':f'rosalind/roundtrip-v0.2/{name}.raw.json' if raw.exists() else None}
 if raw.exists():
  result=json.loads(raw.read_text()).get('esearchresult',{});entry.update(count=result.get('count'),ids=result.get('idlist',[]),queryTranslation=result.get('querytranslation'),warnings=result.get('warninglist'),errors=result.get('errorlist'))
 receipts.append(entry);print(json.dumps(entry),flush=True);time.sleep(.4)
(O/'search-log.json').write_text(json.dumps(receipts,indent=2)+'\n')
context=next(x for x in receipts if x['name']=='hcc1395-context')
if context.get('ok') and context.get('ids'):
 req={'endpoint':'efetch','params':{'db':'pubmed','id':','.join(context['ids']),'retmode':'xml'},'response_format':'xml','max_items':10,'save_raw':True,'raw_output_path':str(O/'related-context.raw.xml')}
 p=subprocess.run([sys.executable,str(script)],input=json.dumps(req),text=True,capture_output=True)
 (O/'related-context.plugin.json').write_text(p.stdout)
 print('Related context fetch exit code',p.returncode)
