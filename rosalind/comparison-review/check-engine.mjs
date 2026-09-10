import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {compareStructures,parsePdb,fitRigid} from './sources/structure-pair.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),O='rosalind/comparison-review/',cases=read(O+'fixtures.json'),results=[];
const provenance=read(O+'engine-provenance.json');assert.equal(createHash('sha256').update(fs.readFileSync(O+'sources/structure-pair.mjs')).digest('hex'),provenance.sha256);
for(const c of cases){
 const texts=c.paths.map(p=>fs.readFileSync(p,'utf8'));let result;
 try{result=compareStructures(...texts,c.assignment);}catch(e){if(c.expectedStatus!=='rejected')throw e;results.push({id:c.id,status:'rejected',reason:e.message});continue;}
 assert.equal(c.expectedStatus,'accepted');const oracle=c.independent;
 assert.equal(result.alignment.atomCount,oracle.alignment.atomCount);assert.ok(Math.abs(result.alignment.rmsd-oracle.alignment.rmsd)<1e-9);
 assert.ok(Math.abs(oracle.alignment.determinant-1)<1e-10);
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)assert.ok(Math.abs(result.alignment.rotation[i][j]-oracle.alignment.rotationRowVector[j][i])<1e-9);
 for(let i=0;i<result.differences.length;i++){
  const d=result.differences[i],expected=oracle.differences[i];assert.deepEqual(d.sourceResidues,expected.sourceResidues);
  for(const kind of ['backbone','sidechain']){assert.deepEqual(d[kind].atoms,expected[kind].atoms);if(expected[kind].value===null)assert.equal(d[kind].value,null);else assert.ok(Math.abs(d[kind].value-expected[kind].value)<1e-9);}
 }
 // Reparse exported display coordinates and verify all common-atom scalar values
 // after 0.001 A export rounding. Author identities remain separate in results.
 const displays=result.pdbs.map(parsePdb).map(p=>p.chains.find(c=>c.id==='C'));
 for(const d of result.differences)for(const kind of ['backbone','sidechain'])if(d[kind].value!==null){
  const delta=d[kind].atoms.map(name=>displays.map(p=>p.residues[d.position-1].atoms.find(a=>a.atom===name).xyz));
  const actual=Math.sqrt(delta.reduce((sum,[a,b])=>sum+a.reduce((s,v,i)=>s+(v-b[i])**2,0),0)/delta.length);assert.ok(Math.abs(actual-d[kind].value)<0.002);
 }
 if(c.id==='renumber-insertion')assert.deepEqual(result.differences[5].sourceResidues[1],{chain:'C',number:205,insertion:'A'});
 if(c.id==='missing-w6-sidechain')assert.equal(result.differences[5].sidechain.value,null);
 if(c.id==='symmetric-phenyl-labels')assert.ok(result.differences[7].sidechain.value>1);
 results.push({id:c.id,status:'accepted',alignment:result.alignment,differences:result.differences,displayRoundingToleranceAngstrom:0.002});
}
const kras=['7OW5','7OW6'].map(id=>fs.readFileSync('rosalind/contrast-kras/sources/'+id+'.pdb','utf8'));
assert.throws(()=>compareStructures(...kras,[{hla:'A',peptide:'C'},{hla:'A',peptide:'C'}]),/identical observed HLA sequences/);
const a=[[0,0,0],[1,0,0],[0,2,0],[0,0,3]],ref=a.map(([x,y,z])=>[-x,y,z]);
const reflected=fitRigid(a,ref);const r=reflected.rotation;const det=r[0][0]*(r[1][1]*r[2][2]-r[1][2]*r[2][1])-r[0][1]*(r[1][0]*r[2][2]-r[1][2]*r[2][0])+r[0][2]*(r[1][0]*r[2][1]-r[1][1]*r[2][0]);assert.ok(Math.abs(det-1)<1e-10);assert.ok(reflected.rmsd>0.1);assert.throws(()=>fitRigid([[0,0,0],[1,0,0],[2,0,0]],[[0,0,0],[1,0,0],[2,0,0]]),/collinear/);
fs.writeFileSync(O+'engine-results.json',JSON.stringify({engine:provenance,results,additionalChecks:['Original KRAS pair correctly rejected','Proper rotation does not accept a mirror reflection as exact fit','Collinear fit rejected','All peptide source identities and rounded display distances verified'],limitations:['Numerical acceptance is not biological provenance verification.','Controlled fixtures are not experimental mutations or predictions.']},null,2)+'\n');console.log(results.length+' fixtures checked against independent Kabsch; KRAS rejection, proper rotation and display mapping passed');
