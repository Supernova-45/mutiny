import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {orderTargets,chanceEnvelope,cumulative,shuffle} from '../../src/lib/statistics.mjs';
const cohort=JSON.parse(fs.readFileSync(new URL('../../public/data/cohort.json',import.meta.url)));
const seed=20260909;
const patients=[...new Set(cohort.targets.map(t=>t.patient))].sort((a,b)=>a-b).map(patient=>{
 const all=cohort.targets.filter(t=>t.patient===patient), eligible=all.filter(t=>t.comparisonEligible), total=eligible.filter(t=>t.outcome==='response').length;
 const reference=chanceEnvelope(eligible,seed,2000);
 const orderings=Object.fromEntries(['published','esm','binding','shuffle'].map(method=>{
  const ordered=orderTargets(eligible,method,seed);
  return [method,ordered.map((t,i)=>({k:i+1,targetIds:ordered.slice(0,i+1).map(t=>t.id),responseIds:ordered.slice(0,i+1).filter(t=>t.outcome==='response').map(t=>t.id),recovered:cumulative(ordered)[i+1],totalEligibleResponses:total,reference:reference[i+1],boundaryTie:['esm','binding'].includes(method)&&i+1<ordered.length&&t[method]===ordered[i+1][method]}))];
 }));
 return {patient,eligibleIds:eligible.map(t=>t.id),excluded:all.filter(t=>!t.comparisonEligible).map(t=>({id:t.id,outcome:t.outcome,reason:t.outcome==='pooled'?'Unresolved pooled member':t.outcome==='missing'?'Missing outcome':t.esm===null?'No strictly mapped ESM score':'Missing comparison score'})),informative:total>0&&total<eligible.length,noninformativeReason:eligible.length===0?'Empty eligible intersection':total===0?'Zero detected outcomes':total===eligible.length?'All outcomes detected':null,orderings};
});
// Independent exact small-case distribution: one response at any of three ranks.
const toy=[{id:'a',outcome:'response'},{id:'b',outcome:'undetected'},{id:'c',outcome:'undetected'}];
const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
const exact=permutations.map(p=>p.map(i=>toy[i])).map(a=>a.map((_,k)=>a.slice(0,k+1).filter(x=>x.outcome==='response').length));
const env=chanceEnvelope(toy,seed);
for(let k=1;k<=3;k++){assert.equal(env[k].low,Math.min(...exact.map(x=>x[k-1])));assert.equal(env[k].high,Math.max(...exact.map(x=>x[k-1])));assert.ok(Math.abs(env[k].mean-k/3)<.04);}
assert.deepEqual(shuffle(toy,seed),shuffle(toy,seed));
assert.equal(patients.reduce((n,p)=>n+p.eligibleIds.length,0),188);
assert.equal(patients.reduce((n,p)=>n+(p.orderings.esm.at(-1)?.recovered||0),0),22);
const output={schemaVersion:'0.1.0',study:'Rojas 2023 pancreatic vaccine cohort; separate from ovarian HHAT',question:'Retrospective recovery of individually detected responses among already administered eligible targets',inputSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../public/data/cohort.json',import.meta.url))).digest('hex'),seed,replicates:2000,reference:'Pointwise central 90% random-order reference; sorted counts at floor(1999*0.05) and floor(1999*0.95), not population uncertainty',tieRule:'ESM and binding ascending numeric; equal values use existing id.localeCompare; published preserves source order; shuffle uses source eligible order, reference uses canonical id.localeCompare order',exclusions:'Pooled/missing outcomes and any missing score; target 10:39 stays visible and excluded. Predicted HLA classes do not assign response restriction.',independentCheck:{exactPermutations:6,threeTargetsOnePositive:true,seededMeanTolerance:.04},patients};
fs.writeFileSync(new URL('../response-capture.json',import.meta.url),JSON.stringify(output,null,2)+'\n');console.log(`${patients.length} patients; 188 eligible; 22 positives; all k and four orderings`);
