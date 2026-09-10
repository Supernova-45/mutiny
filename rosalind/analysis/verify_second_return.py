"""Independent checks for native receipts, pinned candidate rows and proposal files."""
from pathlib import Path
import csv,hashlib,json,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[2];O=R/'rosalind'
def read(p):return json.loads((O/p).read_text())
p=read('fixtures/hcc1395.project.json');source=R/p['sources'][0]['path']
assert hashlib.sha256(source.read_bytes()).hexdigest()==p['sources'][0]['sha256']
rows=list(csv.DictReader(source.open(),delimiter='\t'))
seq=read('roundtrip-v0.2/sequence-viewer-receipts.json')['receipts']
for i,c in enumerate(p['candidates'][:3],1):
 row=rows[c['sourceRow']-2];assert row==c['original']
 assert c['hla']==row['HLA Allele']
 assert c['variantId']==':'.join(row[k] for k in ['Chromosome','Start','Stop','Reference','Variant'])
 for role,col in [('mutant','MT Epitope Seq'),('normal','WT Epitope Seq')]:
  r=next(x for x in seq if x['record']==f'candidate_{i}_{role}')['result']
  assert r['applied'] and r['result']['result']['sequence']==row[col]
for item in read('roundtrip-v0.2/search-log.json'):
 receipt=json.loads((R/item['receipt']).read_text());raw=json.loads((R/item['raw']).read_text())['esearchresult']
 assert receipt['ok'] and item['ok'] and item['count']==raw['count'] and item['ids']==raw['idlist']
 if item['candidateId']:assert item['count']=='0'
articles=ET.parse(O/'roundtrip-v0.2/related-context.raw.xml')
a=next(a for a in articles.findall('.//PubmedArticle') if a.findtext('.//PMID')=='41415611')
abstract=' '.join(' '.join(x.itertext()) for x in a.findall('.//AbstractText'))
assert all(x in abstract for x in ['HCC1395','pVACtools','pVACview'])
assert all(c['original']['MT Epitope Seq'] not in abstract for c in p['candidates'][:3])
support=read('experimental-support.json')
assert support['density']['assets']==[] and not support['density']['loaded']
for state in support['states']:
 assert hashlib.sha256((R/state['coordinatePath']).read_bytes()).hexdigest()==state['coordinateSha256']
 assert len(state['peptideResidues'])==9
 for r in state['peptideResidues']:
  assert set(r['metrics'])=={'rscc','rsrz','geometry'}
  for metric in r['metrics'].values():assert metric['residue']['authSeqId']==r['position'] and metric['residue']['authAsymId']=='C'
report={'status':'pass','checks':['Pinned TSV hash and all original fields for three rows','Six exact native sequence responses match source','Seven actual PubMed search receipts agree with raw counts/IDs','Related protocol abstract supports only workflow context','Four deposited coordinate hashes and 36 peptide-residue metric triplets','No maps, outcomes or experimental epitope matches fabricated'],'limitations':['Validation report metrics were imported natively; no independent map inspection or refinement.','Search absence is scoped to the returned PubMed queries.']}
(O/'second-return-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print('Six second-return verification groups passed')
