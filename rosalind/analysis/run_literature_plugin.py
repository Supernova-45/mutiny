"""Run installed Life Sciences Literature skills and verify their resolved XML.
Requires the plugin installation and requests in this Python environment.
Usage: python rosalind/analysis/run_literature_plugin.py /path/to/life-sciences-literature/0.1.5
No private inputs, models, or sequencing datasets are sent.
"""
import hashlib,json,subprocess,sys,tempfile
from pathlib import Path
import requests
R=Path(__file__).resolve().parents[2];O=R/'rosalind/plugin-results';O.mkdir(exist_ok=True)
plugin=Path(sys.argv[1])
for name,skill,script,request in [('devlin-pmc','ncbi-pmc-skill','ncbi_pmc.py',{'params':{'id':'PMC8210748'},'max_items':2}),('devlin-pubmed','ncbi-entrez-skill','ncbi_entrez.py',{'endpoint':'esummary','params':{'db':'pubmed','id':'32807968','retmode':'json'},'max_items':2})]:
 request.update(save_raw=True,raw_output_path=str(O/(name+'.raw.json')))
 result=subprocess.run([sys.executable,str(plugin/'skills'/skill/'scripts'/script)],input=json.dumps(request),text=True,capture_output=True,check=True)
 receipt=json.loads(result.stdout);assert receipt['ok'],receipt
 (O/(name+'.json')).write_text(result.stdout+'\n')
metadata=json.loads((O/'devlin-pmc.json').read_text());source=metadata['records'][0]['xml_url']
response=requests.get(source,timeout=45);response.raise_for_status()
# Integrity query is supplied by the public source; it is not a credential.
from urllib.parse import urlsplit,parse_qs
expected=parse_qs(urlsplit(source).query).get('md5',[None])[0]
if expected:assert hashlib.md5(response.content).hexdigest()==expected
with tempfile.TemporaryDirectory(prefix='mutiny-literature-') as temporary:
 path=Path(temporary)/'article.xml';path.write_bytes(response.content)
 subprocess.run([sys.executable,str(R/'rosalind/analysis/plugin_evidence_check.py'),str(path)],check=True)
print('Life Sciences Literature retrieval and assay-source verification complete')
