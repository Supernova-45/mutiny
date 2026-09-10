import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {migrate01,makeRequest,makeReturn,attach,digest} from './exchange.mjs';
const O=fileURLToPath(new URL('../',import.meta.url));
const read=p=>JSON.parse(fs.readFileSync(O+p,'utf8'));
const write=(p,x)=>fs.writeFileSync(O+p,JSON.stringify(x,null,2)+'\n');
const old=read('fixtures/hcc1395.project.json'),p=migrate01(old),selected=old.candidates.slice(0,3);
const log=read('roundtrip-v0.2/search-log.json'),seq=read('roundtrip-v0.2/sequence-viewer-receipts.json');
const req=makeRequest(p,'hcc1395-evidence-request-20260910',selected.map(c=>c.id),['Verify exact peptide/HLA/reference/variant context against the pinned source.','Find exact experimental epitope evidence or explicitly scope unresolved/no-exact-match findings.']);
const claims=[],findings=[];
for(const [i,c] of selected.entries()){
  const o=c.original;
  for(const [role,col] of [['mutant','MT Epitope Seq'],['normal','WT Epitope Seq']]){
    const r=seq.receipts.find(x=>x.record===`candidate_${i+1}_${role}`).result;
    if(!r.applied || r.result.result.sequence!==o[col])throw Error('Native sequence mismatch');
  }
  const changes=[...o['MT Epitope Seq']].flatMap((aa,k)=>aa!==o['WT Epitope Seq'][k]?[k+1]:[]);
  if(changes.length!==1 || changes[0]!==Number(o['Mutation Position']))throw Error('Mutation identity mismatch');
  const searches=log.filter(x=>x.candidateId===c.id);
  if(searches.length!==2 || searches.some(x=>!x.ok || x.count!=='0'))throw Error('Search result requires fresh review');
  const id=`HCC-CONTEXT-${i+1}`;
  claims.push({id,candidateIds:[c.id],evidenceLevel:'fixture_identity',claim:'Mutant/normal peptide, HLA, variant and versioned transcript match the pinned public source row; native Sequence Viewer returned both exact peptide strings.',sources:[{path:'rosalind/fixtures/sources/HCC1395.filtered.tsv',url:p.scientificData.sources[0].url,location:`TSV physical line ${c.sourceRow}, columns MT Epitope Seq, WT Epitope Seq, HLA Allele, Transcript, HGVSc, HGVSp, Reference, Variant`,sha256:p.scientificData.sources[0].sha256},{path:'rosalind/roundtrip-v0.2/sequence-viewer-receipts.json',location:`candidate_${i+1}_mutant and candidate_${i+1}_normal, 1-based inclusive 1–9`}],details:{mutant:o['MT Epitope Seq'],normal:o['WT Epitope Seq'],hla:c.hla,variantId:c.variantId,transcript:o.Transcript,hgvsc:o.HGVSc,hgvsp:o.HGVSp,genomicReference:o.Reference,genomicAlternate:o.Variant,genomeBuild:null,mutationPeptidePosition:changes[0]},limitations:['Identity is verified against the pinned fixture, not a new genome/transcript-reference reconciliation.','Genome assembly and predictor/model versions are not certified by this table.','Supplied scores are predictions, not binding measurements or response labels.']});
  findings.push({candidateId:c.id,status:'no_exact_match',claimIds:[id,'HCC-RELATED-PROTOCOL'],reason:'No exact experimental epitope match identified within these dated PubMed queries; zero indexed results are not proof that evidence does not exist.',searchScope:{database:'PubMed via Life Sciences Literature 0.1.5',queries:searches,scopeLimitations:['Indexed PubMed fields, not an exhaustive full-text or supplement search.','No IEDB, patent, unpublished or exhaustive structure-database search performed.','Quoted-phrase-not-found warnings retained.','No clinical outcomes, experimental binding values or structures inferred.']}});
}
claims.push({id:'HCC-RELATED-PROTOCOL',candidateIds:selected.map(c=>c.id),evidenceLevel:'related_context',claim:'The ImmunoNX preprint describes a pVACtools/pVACview workflow demonstrated using HCC1395. This is related workflow context; its abstract does not establish an experimental match for any selected peptide/HLA pair.',sources:[{url:'https://pubmed.ncbi.nlm.nih.gov/41415611/',path:'rosalind/roundtrip-v0.2/related-context.raw.xml',location:'PubmedArticle PMID 41415611, Abstract; retrieved through related-context.plugin.json'}],limitations:['PubMed records this item as an ArXiv preprint; peer-reviewed status is not claimed.','The abstract alone does not establish exact candidate membership or experimental epitope recognition.','Other returned HCC1395 cell-line papers (PMIDs 24606732 and 20526721) were screened as unrelated to these epitope identities.']});
const response=makeReturn(req,'hcc1395-evidence-return-20260910',findings,claims,[]);
const imported=attach(p,req,response);
write('roundtrip-v0.2/project.json',p);write('roundtrip-v0.2/request.json',req);write('roundtrip-v0.2/return.json',response);
write('roundtrip-v0.2/import-result.json',{status:imported.status,ledger:imported.ledger,scientificDigest:p.scientificDigest,contextDigest:req.contextDigest,reviewStateDigestBefore:digest(p.reviewState),reviewStateDigestAfter:digest(imported.project.reviewState),outcomeCount:imported.project.scientificData.outcomes.length});
console.log('Three source-verified candidates, six native sequence reads, scoped no-exact-match returns; no outcomes added');
