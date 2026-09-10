"""Retrieve exact public deposited sources and installed literature-plugin metadata."""
from pathlib import Path
import hashlib,json,subprocess,sys,datetime
import requests
R=Path(__file__).resolve().parents[2];O=R/'rosalind/contrast-kras';S=O/'sources';S.mkdir(parents=True,exist_ok=True)
receipt=[]
for id in ['7OW3','7OW4','7OW5','7OW6']:
 for name,url in [(id+'.pdb',f'https://files.rcsb.org/download/{id}.pdb'),(id+'.entry.json',f'https://data.rcsb.org/rest/v1/core/entry/{id}')]:
  r=requests.get(url,timeout=45);r.raise_for_status();(S/name).write_bytes(r.content);receipt.append({'path':str((S/name).relative_to(R)),'url':url,'sha256':hashlib.sha256(r.content).hexdigest(),'bytes':len(r.content),'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()})
plugin=Path(sys.argv[1]);req={'params':{'id':'10.1038/s41467-022-32811-1'},'max_items':2,'save_raw':True,'raw_output_path':str(S/'poole-pmc.raw.json')}
p=subprocess.run([sys.executable,str(plugin/'skills/ncbi-pmc-skill/scripts/ncbi_pmc.py')],input=json.dumps(req),text=True,capture_output=True);(S/'poole-pmc.plugin.json').write_text(p.stdout);result=json.loads(p.stdout);assert result['ok'],result
url=result['records'][0]['xml_url'];r=requests.get(url,timeout=45);r.raise_for_status();(S/'poole.xml').write_bytes(r.content);receipt.append({'path':str((S/'poole.xml').relative_to(R)),'url':url,'sha256':hashlib.sha256(r.content).hexdigest(),'bytes':len(r.content),'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()})
(O/'retrieval.json').write_text(json.dumps(receipt,indent=2)+'\n');print('Four original PDBs, entry metadata, and plugin-resolved Poole XML retrieved')
