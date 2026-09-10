import { createHash } from 'node:crypto';

export const VERSION = '0.2.0';
export const PROFILE = 'mutiny-canonical-json-1';
const clone = x => JSON.parse(JSON.stringify(x));
const fail = message => { throw new Error(message); };

// Reject duplicate object keys before parsing loses that evidence. JSON syntax
// and number semantics remain native ECMAScript; untrusted input is never eval'd.
export function parseStrict(text) {
  let i=0;
  const ws=()=>{while (/\s/.test(text[i]||'') && i<text.length) i++;};
  function string() {
    const start=i++; let escaped=false;
    while(i<text.length) {const c=text[i++]; if(!escaped && c==='"')return JSON.parse(text.slice(start,i)); if(!escaped && c==='\\')escaped=true;else escaped=false;}
    return fail('Unterminated string');
  }
  function value() {
    ws(); const c=text[i];
    if(c==='"') return string();
    if(c==='{') {i++;ws();const o=Object.create(null),keys=new Set();if(text[i]==='}') {i++;return o;}
      for(;;){ws();if(text[i]!=='"')fail('Expected object key');const k=string();if(keys.has(k))fail('Duplicate JSON key');keys.add(k);ws();if(text[i++]!==':')fail('Expected colon');o[k]=value();ws();const end=text[i++];if(end==='}')return o;if(end!==',')fail('Expected comma');}}
    if(c==='['){i++;ws();const a=[];if(text[i]===']'){i++;return a;}for(;;){a.push(value());ws();const end=text[i++];if(end===']')return a;if(end!==',')fail('Expected comma');}}
    const m=text.slice(i).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/);if(!m)fail('Invalid JSON');i+=m[0].length;return JSON.parse(m[0]);
  }
  // Native parser independently enforces strict JSON whitespace/string grammar.
  JSON.parse(text);const result=value();ws();if(i!==text.length)fail('Trailing JSON');canonical(result);return result;
}

export function canonical(x) {
  if(x===null)return 'null';
  if(typeof x==='string') {
    if(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(x))fail('Lone surrogate');
    return JSON.stringify(x);
  }
  if(typeof x==='number') {if(!Number.isFinite(x)||(Number.isInteger(x)&&!Number.isSafeInteger(x)))fail('Invalid or unsafe number');return JSON.stringify(x);}
  if(typeof x==='boolean')return JSON.stringify(x);
  if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
  if(typeof x==='object')return '{'+Object.keys(x).sort().map(k=>canonical(k)+':'+canonical(x[k])).join(',')+'}';
  return fail('Non-JSON type');
}
export const digest = x => createHash('sha256').update(canonical(x),'utf8').digest('hex');
function sortedUnique(rows,key) {
  if(!Array.isArray(rows))fail('Missing scientific table');const entries=rows.map(x=>[canonical(key(x)),x]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
  if(new Set(entries.map(x=>x[0])).size!==rows.length)fail('Duplicate scientific key');return entries.map(x=>x[1]);
}
export function normalizedScience(d) {
  const x=clone(d);
  for(const k of ['groups','sources','candidates','sequences','methods'])x[k]=sortedUnique(x[k],r=>r.id);
  x.scores=sortedUnique(x.scores,r=>[r.candidateId,r.methodId,r.context]);
  x.outcomes=sortedUnique(x.outcomes,r=>r.assayId);
  x.assayMembers=sortedUnique(x.assayMembers,r=>[r.assayId,r.candidateId]);
  x.exclusions=sortedUnique(x.exclusions,r=>[r.candidateId,r.scope,r.reason]);
  return x;
}
export function scientificDigest(data) {return digest({profile:PROFILE,scientificData:normalizedScience(data)});}
export function migrate01(old) {
  if(old.schemaVersion!=='0.1.0')fail('Explicit 0.1.0 migration only');
  const {schemaVersion,title,annotations,view,...scientificData}=clone(old);
  return {schemaVersion:VERSION,identityProfile:PROFILE,projectId:old.projectId,scientificData,scientificDigest:scientificDigest(scientificData),reviewState:{title,annotations,view,notes:[],proposedCorrections:[]},migration:{fromVersion:'0.1.0',originalCanonicalDigest:digest(old),policy:'explicit-copy-v1'}};
}
export function verifyProject(p) {
  if(p.schemaVersion!==VERSION || p.identityProfile!==PROFILE)fail('Unsupported version/profile');
  if(p.projectId!==p.scientificData.projectId)fail('Project mismatch');
  if(p.scientificDigest!==scientificDigest(p.scientificData))fail('Scientific digest mismatch');
}
export function candidateContexts(p,selected) {
  verifyProject(p);const d=p.scientificData;
  if(!selected.length || new Set(selected).size!==selected.length)fail('Empty or duplicate requested candidates');
  return [...selected].sort().map(id=>{
    const candidate=d.candidates.find(x=>x.id===id);if(!candidate)fail('Unknown candidate');
    const scores=d.scores.filter(x=>x.candidateId===id);
    const sequenceIds=new Set([candidate.sequenceId,...scores.map(x=>x.sequenceId).filter(Boolean)]);
    // The legacy fixture has a named paired normal sequence; retain it explicitly.
    const normal=d.sequences.find(x=>x.id===id+':normal');if(normal)sequenceIds.add(normal.id);
    const sequences=sortedUnique(d.sequences.filter(x=>sequenceIds.has(x.id)),x=>x.id);
    if(!sequences.some(x=>x.id===candidate.sequenceId))fail('Missing candidate sequence');
    const methodIds=new Set(scores.map(x=>x.methodId));
    const methods=sortedUnique(d.methods.filter(x=>methodIds.has(x.id)),x=>x.id);
    if(methods.length!==methodIds.size)fail('Missing method context');
    const sourceIds=new Set([candidate.sourceId,...methods.map(x=>x.sourceId)]);
    const sources=sortedUnique(d.sources.filter(x=>sourceIds.has(x.id)),x=>x.id);
    if(sources.length!==sourceIds.size)fail('Missing source context');
    return {candidateId:id,candidate:clone(candidate),sequences,methods,scores:sortedUnique(scores,x=>[x.methodId,x.context]),sources};
  });
}
export function makeRequest(p,requestId,selected,questions) {
  const contexts=candidateContexts(p,selected);
  const body=clone({schemaVersion:VERSION,identityProfile:PROFILE,requestId,projectId:p.projectId,scientificDigest:p.scientificDigest,contextDigest:digest({profile:PROFILE,contexts}),selectedCandidateIds:contexts.map(x=>x.candidateId),contexts,questions});
  return {...body,requestDigest:digest(body)};
}
function requestBody(req) {const {requestDigest,...body}=req;return body;}
export function verifyRequest(p,req) {
  verifyProject(p);
  if(req.schemaVersion!==VERSION || req.identityProfile!==PROFILE)fail('Request version/profile mismatch');
  if(req.projectId!==p.projectId || req.scientificDigest!==p.scientificDigest)fail('Stale or foreign request');
  if(req.requestDigest!==digest(requestBody(req)))fail('Request digest mismatch');
  const contexts=candidateContexts(p,req.selectedCandidateIds);
  if(canonical(contexts)!==canonical(req.contexts) || req.contextDigest!==digest({profile:PROFILE,contexts}))fail('Context mismatch');
}
export function makeReturn(req,returnId,findings,claims,proposedCorrections=[]) {
  const body=clone({schemaVersion:VERSION,identityProfile:PROFILE,returnId,requestId:req.requestId,requestDigest:req.requestDigest,projectId:req.projectId,scientificDigest:req.scientificDigest,contextDigest:req.contextDigest,selectedCandidateIds:req.selectedCandidateIds,findings,claims,proposedCorrections});
  return {...body,returnDigest:digest(body)};
}
export function attach(p,req,res,ledger={returns:{},claims:{}}) {
  verifyRequest(p,req);
  if(res.schemaVersion!==VERSION || res.identityProfile!==PROFILE)fail('Return version/profile mismatch');
  for(const k of ['requestId','requestDigest','projectId','scientificDigest','contextDigest'])if(res[k]!==req[k])fail('Return mismatch: '+k);
  if(canonical(res.selectedCandidateIds)!==canonical(req.selectedCandidateIds))fail('Candidate set/order mismatch');
  const {returnDigest,...body}=res;if(returnDigest!==digest(body))fail('Return digest mismatch');
  const findings=sortedUnique(res.findings,x=>x.candidateId);
  if(canonical(findings.map(x=>x.candidateId))!==canonical(req.selectedCandidateIds))fail('Incomplete findings');
  sortedUnique(res.claims,x=>x.id);sortedUnique(res.proposedCorrections,x=>x.id);
  const claimIds=new Set(res.claims.map(x=>x.id)),selected=new Set(req.selectedCandidateIds);
  for(const f of findings){if(!['resolved','unresolved','no_exact_match','unsupported'].includes(f.status))fail('Unknown finding status');if(f.status!=='resolved'&&!f.reason)fail('Missing finding reason');if(new Set(f.claimIds).size!==f.claimIds.length)fail('Duplicate finding claim');for(const id of f.claimIds){if(!claimIds.has(id))fail('Missing claim');if(!res.claims.find(c=>c.id===id).candidateIds.includes(f.candidateId))fail('Claim context mismatch');}}
  for(const c of res.claims){if(!c.candidateIds.length||c.candidateIds.some(x=>!selected.has(x)))fail('Foreign claim candidate');if(!c.sources?.length)fail('Missing claim sources');}
  for(const c of res.proposedCorrections){if(c.applyAutomatically!==false)fail('Automatic correction forbidden');if(!selected.has(c.candidateId))fail('Foreign correction');}
  const next=clone(ledger),returnKey=canonical([p.projectId,req.scientificDigest,res.returnId]);
  if(next.returns[returnKey] && next.returns[returnKey]!==returnDigest)fail('Return ID collision');
  const duplicate=next.returns[returnKey]===returnDigest;
  for(const c of res.claims){const key=canonical([p.projectId,req.scientificDigest,c.id]),hash=digest(c);if(next.claims[key]&&next.claims[key]!==hash)fail('Conflicting claim ID');next.claims[key]=hash;}
  next.returns[returnKey]=returnDigest;
  // Immutable return evidence and import ledger only. Never mutate scientific or
  // human review fields; unresolved findings cannot create response outcomes.
  return {status:duplicate?'already_imported':'imported',ledger:next,project:clone(p),evidence:clone(res)};
}
