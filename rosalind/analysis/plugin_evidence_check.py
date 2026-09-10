"""Verify assay extraction against full text resolved by Life Sciences Literature.
Usage: python rosalind/analysis/plugin_evidence_check.py /path/to/resolved.xml
XML remains outside the repo; source hash and bounded structured facts are exported.
"""
import hashlib,json,re,sys,xml.etree.ElementTree as E
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];O=ROOT/'rosalind'
path=Path(sys.argv[1]);root=E.parse(path).getroot()
metadata=json.loads((O/'plugin-results/devlin-pmc.json').read_text());assert metadata['ok'];record=metadata['records'][0]
assert record['pmcid']=='PMC8210748' and record['doi']=='10.1038/s41589-020-0610-1'
plain=lambda e:' '.join(''.join(e.itertext()).split())
table=next(t for t in root.findall('.//table-wrap') if t.get('id')=='T1')
rows=[]
for tr in table.findall('.//tbody/tr'):
 cells=[plain(t) for t in tr.findall('td')]
 if len(cells)!=3:continue
 match=re.search(r'(\d+)\s*±\s*(\d+)\s*\(n=(\d+)\)',cells[1])
 rows.append(dict(peptideLabel=cells[0],kdMicromolar=int(match[1]) if match else None,sdMicromolar=int(match[2]) if match else None,n=int(match[3]) if match else None,status='measured' if match else 'not_detected',reportedFreeEnergy=cells[2],location='Table 1',temperatureC=25))
assert [(x['kdMicromolar'],x['sdMicromolar'],x['n']) for x in rows[:2]]==[(9,1,9),(200,30,9)]
assert [x['kdMicromolar'] for x in rows]==[9,200,170,1600,None,None,700]
alltext=plain(root);itc=plain(next(f for f in root.findall('.//fig') if f.get('id')=='F6'))
assert '1.7 μM' in itc and '1.4 μM' in itc
assert 'higher than that determined by SPR' in alltext
fig2=plain(next(f for f in root.findall('.//fig') if f.get('id')=='F2'))
assert '10 °C' in fig2 and 'Association rates were calculated' in fig2
report=dict(schemaVersion='0.1.0',plugin=dict(name='Life Sciences Literature',version='0.1.5',operation='ncbi-pmc-skill resolves current full-text source; ncbi-entrez-skill confirms PubMed record'),execution='Installed plugin Python scripts plus separately identified local XML validation; not a mounted Workbench UI analysis',sourceUrl=record['xml_url'],canonicalUrl=record['canonical_url'],sourceSha256=hashlib.sha256(path.read_bytes()).hexdigest(),sourceMd5=hashlib.md5(path.read_bytes()).hexdigest(),articleVersion=record['version'],licenseCode=record['license_code'],isPmcOpenaccess=record['is_pmc_openaccess'],isManuscript=record['is_manuscript'],isRetracted=record['is_retracted'],table1=rows,checks={'SPR25CValuesAndSDAndN':True,'KineticsAre10CAndKonDerived':True,'ITCPrintedReplicates':[1.7,1.4],'ITCProseCaptionConflict':True,'figureOnlyNumericLabelsNotClaimedAsXMLExtraction':True},limitations=['No measured peptide-HLA KD inferred from thermal stability.','Bta/alanine variants are additional experimental ligands, not new structural states.','No full text or published figure redistributed.','Source license/retraction metadata is not itself biological evidence.'])
(O/'plugin-results/assay-source-check.json').write_text(json.dumps(report,indent=2)+'\n');print('Verified 7 Table 1 ligands and source-specific assay semantics')
