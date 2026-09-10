import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('public/data/hhat-evidence.json');

test('UI ligand values preserve source uncertainty, missingness and actual structure availability',()=>{
  const table=read('rosalind/plugin-results/assay-source-check.json').table1;
  assert.equal(data.experiments.length,7);
  data.experiments.forEach((r,i)=>{
    assert.equal(r.sourceLabel,table[i].peptideLabel);assert.equal(r.value,table[i].kdMicromolar);
    assert.equal(r.sd,table[i].sdMicromolar);assert.equal(r.n,table[i].n);assert.equal(r.temperatureC,25);
    if(r.group!=='original')assert.deepEqual(r.structureIds,[]);
    if(r.value===null){assert.equal(r.status,'not_detected');assert.equal(r.sd,null);assert.equal(r.n,null);}
  });
  assert.equal(data.experiments.find(r=>r.id==='mutant').value,9);
  assert.equal(data.experiments.find(r=>r.id==='normal').value,200);
  assert.equal(data.experiments.find(r=>r.id==='mutant-bta').value,170);
});
test('Contact annotations use the actual displayed atom frame, preserving source geometry',()=>{
  const mechanism=read('rosalind/mechanism.json');
  for(const contact of data.contacts){
    const bytes=fs.readFileSync(`public/structures/${contact.state}.pdb`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),contact.displaySha256);
    const atoms=bytes.toString().split('\n').filter(l=>l.startsWith('ATOM'));
    const position=l=>[30,38,46].map(i=>Number(l.slice(i,i+8)));
    const nitrogen=position(atoms.find(l=>l[21]==='C'&&Number(l.slice(22,26))===6&&l.slice(12,16).trim()==='NE1'));
    assert.deepEqual(contact.start,nitrogen);
    const ring=atoms.filter(l=>l[21]==='D'&&Number(l.slice(22,26))===100&&['CG','CD1','CD2','CE1','CE2','CZ'].includes(l.slice(12,16).trim())).map(position);
    assert.equal(ring.length,6);assert.deepEqual(contact.end,[0,1,2].map(i=>ring.reduce((sum,p)=>sum+p[i],0)/6));
    assert.ok(Math.abs(Math.hypot(...contact.start.map((v,i)=>v-contact.end[i]))-contact.value)<.01);
    assert.equal(contact.value,mechanism.states.find(s=>s.id===contact.state).w6Tyr100Alpha.indoleNitrogenToTyrRingCentroid.value);
  }
});
test('Generated evidence declares current source hashes and keeps RMSD distinct from atom displacement',()=>{
  for(const input of data.provenance.inputs)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(input.path)).digest('hex'),input.sha256);
  assert.equal(data.comparisons.length,4);assert.ok(data.comparisons.every(c=>c.atoms.length===9));
  const freeBound=data.comparisons.find(c=>c.states[0]==='6UJO'&&c.states[1]==='6UK4');
  assert.ok(freeBound.rmsd>1&&freeBound.rmsd<1.1);
});
