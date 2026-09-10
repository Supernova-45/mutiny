import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseProject,validateProject,compareProject,saveReview,safeSourceUrl} from '../src/lib/project.mjs';
const fixture=()=>JSON.parse(fs.readFileSync('rosalind/fixtures/hcc1395.project.json','utf8'));
const compare=p=>compareProject(p,p.groups[0].id,p.methods[0].id,p.methods[1].id,5);

test('Independent fixture compares real scores without adding outcomes',()=>{
  const p=validateProject(fixture()),c=compare(p);
  assert.equal(p.candidates.length,11);assert.equal(c.eligible,11);assert.equal(p.outcomes.length,0);
  for(let i=0;i<2;i++)for(let j=1;j<11;j++)assert.ok(c.orders[i][j-1].scores[i].value<=c.orders[i][j].scores[i].value);
  const common=new Set(c.orders[0].slice(0,5).map(r=>r.candidate.id));
  assert.equal(c.overlap,c.orders[1].slice(0,5).filter(r=>common.has(r.candidate.id)).length);
});
test('Schema and identity errors are rejected before a project replaces current work',()=>{
  const bads=[
    p=>{p.schemaVersion='2.0.0'},
    p=>{p.candidates.push(p.candidates[0])},
    p=>{p.scores[0].candidateId='foreign'},
    p=>{p.scores.push(p.scores[0])},
    p=>{p.methods[0].direction='best'},
    p=>{p.scores[0].value=null},
    p=>{p.candidates[0].sequenceId='missing'},
  ];
  for(const mutate of bads){const p=fixture();mutate(p);assert.throws(()=>validateProject(p));}
  assert.throws(()=>parseProject('{'));assert.throws(()=>parseProject('null'));
});
test('Missing and incompatible scores stay inspectable outside the common ranking',()=>{
  for(const change of [s=>{s.value=null;s.status='missing';s.missingReason='Not supplied'},s=>{s.hla='HLA-A*02:01'},s=>{s.sequenceId=null}]){
    const p=fixture(),id=p.scores[0].candidateId;change(p.scores[0]);validateProject(p);
    const c=compare(p);assert.equal(c.eligible,10);assert.ok(c.excluded.some(e=>e.candidate.id===id));
    assert.ok(c.orders.every(rows=>rows.every(r=>r.candidate.id!==id)));assert.equal(p.candidates.length,11);
  }
  const p=fixture();p.scores.push({...p.scores[0],context:'another peptide context'});validateProject(p);
  assert.match(compare(p).excluded[0].reason,/Multiple/);
  const changed=fixture();changed.candidates[0].hla='HLA-A*02:01';validateProject(changed);
  assert.match(compare(changed).excluded[0].reason,/Scored HLA/);
});
test('Comparison respects group membership, declared direction and cutoff ties',()=>{
  const p=fixture();p.groups.push({id:'other',label:'Other sample'});p.candidates[0].groupId='other';
  for(const score of p.scores)if(score.methodId===p.methods[0].id)score.value=100;
  p.methods[1].direction='descending';
  const c=compare(p);assert.equal(c.eligible,10);assert.equal(c.tied,true);
  assert.ok(c.orders[0].every(r=>r.candidate.groupId===p.groups[0].id));
  for(let i=1;i<c.orders[1].length;i++)assert.ok(c.orders[1][i-1].scores[1].value>=c.orders[1][i].scores[1].value);
  assert.deepEqual(c.orders[0].map(r=>r.candidate.id),c.orders[0].map(r=>r.candidate.id).sort());
});
test('Review round trip preserves originals, nulls, notes, IDs and view state',()=>{
  const p=fixture(),id=p.candidates[3].id;p.annotations.push({note:'Preexisting external annotation',author:'another tool'});
  let saved=saveReview(p,id,{note:'Check exact allele\nKeep this note',status:'investigate'});
  saved=saveReview(saved,id,{note:'Revised note'});saved.view={...saved.view,selectedCandidateId:id,inspectedCount:3};
  const reopened=parseProject(JSON.stringify(saved));
  for(const field of ['candidates','sequences','scores','methods','sources','outcomes'])assert.deepEqual(reopened[field],p[field]);
  assert.equal(reopened.annotations.filter(a=>a.kind==='mutiny-review').length,1);
  assert.equal(reopened.annotations[0].author,'another tool');assert.equal(reopened.annotations[1].status,'investigate');
  assert.equal(reopened.annotations[1].note,'Revised note');assert.equal(reopened.view.selectedCandidateId,id);
  assert.equal(safeSourceUrl('javascript:alert(1)'),null);assert.equal(safeSourceUrl('https://www.rcsb.org/structure/6UK4'),'https://www.rcsb.org/structure/6UK4');
});
