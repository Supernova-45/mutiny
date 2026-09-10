"""Offline evidence assembly from original deposits, article XML and native receipts."""
from pathlib import Path
import sys,json,hashlib,xml.etree.ElementTree as ET
import numpy as np
O=Path(__file__).resolve().parent;R=O.parents[1]
sys.path.insert(0,str(O.parent/'comparison-review'))
from independent import parse,sequence,write
S=O/'sources'
def seqres(path):
 out={}
 for l in path.read_text().splitlines():
  if l.startswith('SEQRES'):out.setdefault(l[11],[]).extend(l[19:70].split())
 return out
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
coords={id:parse(S/(id+'.pdb')) for id in ['7OW3','7OW4','7OW5','7OW6']}
declared={id:seqres(S/(id+'.pdb')) for id in coords}
for c in ['A','D','E']:assert declared['7OW5'][c]==declared['7OW6'][c],c
assert sequence(coords['7OW5']['C'])=='VVVGAGGVGK'
assert sequence(coords['7OW6']['C'])=='VVVGADGVGK'
native_sequences=json.load(open(O/'native-sequences.json'))
for op,id in zip(native_sequences['operations'],['7OW5','7OW6']):
 assert op['response']['structuredContent']['result']['result']['sequence']==sequence(coords[id]['C'])
expected={'VAL':{'N','CA','C','O','CB','CG1','CG2'},'GLY':{'N','CA','C','O'},'ALA':{'N','CA','C','O','CB'},'ASP':{'N','CA','C','O','CB','CG','OD1','OD2'},'LYS':{'N','CA','C','O','CB','CG','CD','CE','NZ'}}
coverage=[]
for id,chains in coords.items():
 for c in (['C','F','I','L'] if id in ['7OW3','7OW4'] else ['C']):
  rows=[]
  for n in range(1,11):
   res=chains[c].get((n,''));name=declared[id][c][n-1]
   rows.append({'authorNumber':n,'insertion':'','declaredResidue':name,'observed':res is not None,'atoms':list(res['atoms']) if res else [],'missingExpectedHeavyAtoms':sorted(expected[name]-set(res['atoms'] if res else [])),'altlocs':sorted({a['altloc'] for a in res['atoms'].values()}) if res else [],'occupancies':sorted({a['occupancy'] for a in res['atoms'].values()}) if res else []})
  coverage.append({'pdb':id,'chain':c,'declaredSequence':declared[id][c],'observedSequence':sequence(chains[c]),'rows':rows,'missingResidues':[r['authorNumber'] for r in rows if not r['observed']]})
write(O/'coverage.json',{'method':'First deposited ATOM model; blank or A altloc, blank preferred; no modeled filling. Full author-number coverage, not an alignment of shortened observed strings. OXT optional.','peptideCopies':coverage,'hlaAndTcrConstructCheck':{'source':'SEQRES original PDB files','equalDeclaredChains':['A','D','E'],'chains':[{'chain':c,'declaredResidueCount':len(declared['7OW5'][c]),'normalObservedCount':len(coords['7OW5'][c]),'mutantObservedCount':len(coords['7OW6'][c]),'normalObservedIdentities':[list(k) for k in coords['7OW5'][c]],'mutantObservedIdentities':[list(k) for k in coords['7OW6'][c]]} for c in ['A','D','E']]}})
contacts=[]
for id in ['7OW5','7OW6']:
 for residue in [70,114]:
  p=coords[id]['C'][(6,'')]['atoms'];h=coords[id]['A'][(residue,'')]['atoms']
  d,a,b=min((float(np.linalg.norm(x['xyz']-y['xyz'])),a,b) for a,x in p.items() for b,y in h.items())
  contacts.append({'pdb':id,'distanceAngstrom':d,'peptideAtom':{'chain':'C','residue':6,'name':a},'hlaAtom':{'chain':'A','residue':residue,'name':b},'method':'Local closest heavy-atom Euclidean distance in original deposited frame; no fit needed for intra-object measurement.'})
native=json.load(open(O/'native-contacts.json'))
for i,contact in enumerate(contacts[2:]):
 v=native['operations'][i]['response']['structuredContent']['state']['measurement']['value'];assert abs(v-contact['distanceAngstrom'])<1e-5
write(O/'contacts.json',contacts)
xml=ET.parse(S/'poole.xml');tables={t.get('id'):' '.join(t.itertext()) for t in xml.findall('.//table-wrap')}
assert '7.43' in tables['Tab2'] and '3.00E-06' in tables['Tab2'] and '>4000' in tables['Tab2']
sections=[{'title':''.join(s.find('title').itertext()),'text':' '.join(s.itertext())} for s in xml.findall('.//sec') if s.find('title') is not None and 'Binding affinity' in ''.join(s.find('title').itertext())]
write(O/'assay-source-extracts.json',{'license':'CC-BY-4.0','attribution':'Poole et al. Nature Communications 13, 5333 (2022). https://doi.org/10.1038/s41467-022-32811-1','sourceSha256':sha(S/'poole.xml'),'tables':{k:tables[k] for k in ['Tab2','Tab3']},'methods':sections})
comparison=json.load(open(O/'independent-comparison.json'))
for mode in ['commonAuthorWhole','platform']:
 a=comparison[mode]['alignment'];assert abs(a['determinant']-1)<1e-10
 assert a['atomCount']==(275 if mode=='commonAuthorWhole' else 179)
 assert all(x['reference']==x['mobile'] for x in a['residuePairs'])
for id in ['7OW5','7OW6']:
 assert all(not r['missingExpectedHeavyAtoms'] for c in coverage if c['pdb']==id for r in c['rows'])
retrieval=json.load(open(O/'retrieval.json'))
for item in retrieval:assert sha(R/item['path'])==item['sha256']
paper='https://www.nature.com/articles/s41467-022-32811-1'
case={'schemaVersion':'0.1.0','status':'scientific-curation-complete; not compatible with current strict generic importer','id':'kras-g12d-jdia41b1','title':'Similar structures, different receptor binding','cancerContext':{'gene':'KRAS','proteinVariant':'p.Gly12Asp','scope':'Cancer-associated KRAS G12D neoantigen studied with an engineered soluble TCR; not a patient vaccine cohort or clinical efficacy result.'},'identity':{'normalPeptide':'VVVGAGGVGK','mutantPeptide':'VVVGADGVGK','mutationPeptidePosition':6,'hla':'HLA-A*11:01','receptor':'JDIa41b1, second-generation affinity-enhanced JDI TCR','receptorState':'bound in both deposits','normalPdb':'7OW5','mutantPdb':'7OW6','authorChains':{'hla':'A','beta2Microglobulin':'B','peptide':'C','tcrAlpha':'D','tcrBeta':'E'},'constructVerification':'Declared SEQRES A/D/E identical between deposits; observed counts differ. Source receipts and full observed identity lists in coverage.json.'},'question':'These bound peptide structures look similar. Which peptide binds this engineered receptor more tightly?','choices':[{'id':'normal','label':'Normal peptide','matchesMeasuredDirection':False},{'id':'mutant','label':'G12D mutant peptide','matchesMeasuredDirection':True},{'id':'similar','label':'Similar binding','matchesMeasuredDirection':False},{'id':'cannot-infer','label':'The structural similarity alone cannot determine affinity','matchesMeasuredDirection':None,'scientificallyValidCaution':True}],'reveal':{'answerChoice':'mutant','text':'Published SPR shows over 4,000-fold selectivity for mutant pHLA. A small structural difference is compatible with a large affinity difference; static RMSD alone does not predict binding affinity.','source':paper+'#Tab2'},'assays':[{'id':'engineered-tcr-binding','type':'surface-plasmon-resonance TCR-to-pHLA affinity','endpoint':'KD','unit':'M','normal':{'value':3e-6,'standardDeviation':None,'uncertaintyNote':'No uncertainty printed for this WT table cell.'},'mutant':{'value':7.43e-10,'standardDeviation':.18e-10},'n':2,'nMeaning':'Table 2 footnote ±SD, n=2; methods state minimum two measurements.','reportedAffinityWindow':'>4000','derivedRatioFromRoundedValues':3e-6/7.43e-10,'ratioCaveat':'Ratio of rounded reported values, not an independent measurement or confidence bound.','sourceLocation':'Table 2 JDIa41b1 row and Methods: Binding affinity and thermodynamic parameter measurement','sourceUrl':paper+'#Tab2','methodScope':'Biotinylated pHLA on streptavidin-coated CM5; weak-affinity multicycle steady-state Biacore T200, strong-affinity single-cycle kinetic Biacore 8K. Method describes both regimes; per-cell instrument assignment is not explicitly tabulated. Baseline assay temperature not specified in extracted methods. Thermodynamic temperature series is a separate experiment.','notAssays':['peptide–HLA KD','peptide–HLA thermal stability','cell killing','clinical or vaccine efficacy']}],'geometry':{'evidenceType':'local static deposited-coordinate analysis, independently checked with native Molecular Structure Viewer','comparisonFile':'independent-comparison.json','wholeHla':{'sharedCaCount':275,'rmsdAngstrom':comparison['commonAuthorWhole']['alignment']['rmsd'],'excludedFromMutant':[{'chain':'A','authorNumber':1,'reason':'not observed in normal'}]},'platform':{'sharedCaCount':179,'rmsdAngstrom':comparison['platform']['alignment']['rmsd'],'declaredRegion':'HLA author positions 1–180; observed shared 2–180','purpose':'Sensitivity analysis isolating the peptide-binding platform; not a silently substituted whole-chain fit.'},'mutationSidechainRmsd':None,'mutationSidechainReason':'Gly and Asp do not have identical side-chain atom sets.','nativeContactsFile':'native-contacts.json','localContactsFile':'contacts.json','causalLimit':'Short contacts are geometric observations, not binding energies. Paper thermodynamics and simulations are separate source interpretations; no simulations performed here.'},'quality':{'normalResolutionAngstrom':2.58,'mutantResolutionAngstrom':2.64,'source':'RCSB entry metadata and paper Table 3','sourceDiscrepancy':'Results prose reverses the two bound-entry resolution values; use deposition metadata and Table 3, which agree.','normalRworkRfreePercent':[20.6,27.4],'mutantRworkRfreePercent':[21.1,26.8],'peptideMeanBfactorAngstromSquared':[78.11,78.89],'metricsSource':'Table 3; these are global/refinement averages, not side-chain certainty.','coverageFile':'coverage.json','boundPeptideExpectedHeavyAtomCoverage':'Complete for all ten residues under declared parser policy. Blank altloc and occupancy 1 throughout retained peptide atoms.','mapsInspected':False,'freeStates':'7OW3 copies C/L have all ten modeled residues, F lacks 5–7 and I lacks 4–7; every 7OW4 peptide copy lacks 5–6. Do not fill or display an invented complete mutant free pose.'},'displayRequirements':['Keep original deposits unchanged and retain hashes.','Current generic importer must reject observed HLA mismatch; explicit versioned common-reference rule required.','Generic display omits receptor chains; receptor contacts require a curated full-complex integration.','Do not compare free and bound states as mutation-only effects.','Keep native renders distinct from experimental density images.'],'sources':{'paper':paper,'paperXml':'sources/poole.xml','retrievalManifest':'retrieval.json','primaryAssayExtracts':'assay-source-extracts.json'},'redistribution':{'pdbCoordinates':{'license':'CC0-1.0','policy':'https://www.wwpdb.org/about/usage-policies','attribution':'Poole et al.; wwPDB and PDB entries 7OW3, 7OW4, 7OW5, 7OW6'},'paperXmlAndExtracts':{'license':'CC-BY-4.0','attribution':'Poole et al., Nature Communications 13, 5333 (2022), DOI 10.1038/s41467-022-32811-1. Extracted and reformatted; numerical analyses are new.'},'nativeRender':{'kind':'new Molecular Structure Viewer render of public coordinates, not a paper figure or density map','attribution':'Coordinates: Poole et al., PDB 7OW5/7OW6; rendered with Molecular Structure Viewer.'}}}
write(O/'case.json',case)
(O/'peptides.afa').write_text('>7OW5_C observed normal KRAS peptide; HLA-A*11:01; bound JDIa41b1\nVVVGAGGVGK\n>7OW6_C observed mutant KRAS G12D peptide; HLA-A*11:01; bound JDIa41b1\nVVVGADGVGK\n')
print('KRAS case, all peptide-copy coverage, exact assay locations, and native/local contact checks passed')
