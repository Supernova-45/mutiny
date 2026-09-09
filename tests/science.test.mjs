import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {shuffle,orderTargets,chanceEnvelope,cumulative} from '../src/lib/statistics.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/cohort.json',import.meta.url)));
const structures=JSON.parse(fs.readFileSync(new URL('../public/data/structures.json',import.meta.url)));
const count=items=>items.reduce((a,t)=>({...a,[t.outcome]:(a[t.outcome]??0)+1}),{});

test('Published outcomes and identities reconcile without pool imputation',()=>{
 assert.equal(data.targets.length,232);
 assert.equal(new Set(data.targets.map(t=>t.id)).size,232);
 assert.deepEqual(count(data.targets),{undetected:200,response:23,missing:2,pooled:7});
 assert.equal(new Set(data.targets.map(t=>t.patient)).size,16);
 const raw=fs.readFileSync(new URL('../data/raw/rojas-2023-table5.xlsx',import.meta.url));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),data.sourceSha256);
});
test('Comparison eligibility requires two real finite scores and a resolved binary outcome',()=>{
 for(const t of data.targets){
  const expected=Number.isFinite(t.esm)&&Number.isFinite(t.binding)&&['response','undetected'].includes(t.outcome);
  assert.equal(t.comparisonEligible,expected,t.id);
  if(t.esm!==null)assert.equal(t.proteinMapping.status,'verified',t.id);
 }
 assert.equal(data.targets.filter(t=>t.comparisonEligible).length,188);
 assert.deepEqual(count(data.targets.filter(t=>t.comparisonEligible)),{undetected:166,response:22});
});
test('Every record has both predicted classes; annotations are not a restriction partition',()=>{
 assert.ok(data.targets.every(t=>t.hla1&&t.epitope1&&t.hla2&&t.epitope2));
});
test('Orders preserve identity, patient membership, exclusions, and predeclared directions',()=>{
 for(const p of new Set(data.targets.map(t=>t.patient))){
  const original=data.targets.filter(t=>t.patient===p);
  for(const lens of ['esm','binding','shuffle']){
   const ordered=orderTargets(original,lens,17);
   assert.deepEqual(ordered.map(t=>t.id).sort(),original.map(t=>t.id).sort());
   const n=original.filter(t=>t.comparisonEligible).length;
   assert.ok(ordered.slice(0,n).every(t=>t.comparisonEligible));
   assert.ok(ordered.slice(n).every(t=>!t.comparisonEligible));
   if(lens!=='shuffle')for(let i=1;i<n;i++)assert.ok(ordered[i-1][lens]<=ordered[i][lens]);
  }
 }
});
test('Random reference is reproducible, preserves outcomes, and has fixed endpoints',()=>{
 const sample=data.targets.filter(t=>t.patient===10&&t.comparisonEligible);
 assert.deepEqual(shuffle(sample,42),shuffle(sample,42));
 assert.notDeepEqual(shuffle(sample,42).map(t=>t.id),shuffle(sample,43).map(t=>t.id));
 assert.deepEqual(count(shuffle(sample,42)),count(sample));
 const band=chanceEnvelope(sample);
 assert.deepEqual(band,chanceEnvelope([...sample].reverse()),'The chance reference must not change with the displayed lens');
 assert.deepEqual(band[0],{low:0,high:0,mean:0});
 const n=sample.filter(t=>t.outcome==='response').length;
 assert.deepEqual(band.at(-1),{low:n,high:n,mean:n});
 assert.equal(cumulative(sample).at(-1),n);
});
test('Four experimental states have verified sequences, checksums, and HLA alignment',()=>{
 assert.equal(structures.structures.length,4);
 for(const s of structures.structures){
  assert.equal(s.peptide,s.state==='normal'?'KQWLVWLLL':'KQWLVWLFL');
  assert.equal(s.alignedCaCount,180);
  assert.ok(s.platformRmsd<.6);
  const pdb=fs.readFileSync(new URL(`../public/structures/${s.id}.pdb`,import.meta.url));
  assert.equal(crypto.createHash('sha256').update(pdb).digest('hex'),s.alignedSha256);
  assert.ok(s.residues.every(r=>r.sasa>=0&&r.contacts.every(c=>c.distance<=4)));
  if(!s.bound)assert.ok(s.residues.every(r=>r.contacts.length===0));
  else assert.ok(s.residues.find(r=>r.position===6).contacts.some(c=>c.residue==='D:TYR100'),'The recovered crystal mate must reproduce the published Trp6–Tyr100α interface');
 }
});
