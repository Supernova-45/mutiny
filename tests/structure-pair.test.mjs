import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fitRigid,parsePdb,compareStructures} from '../src/lib/structure-pair.mjs';
const normal=fs.readFileSync('data/raw/6UJQ.pdb','utf8'),mutant=fs.readFileSync('data/raw/6UJO.pdb','utf8');
const roles=[{hla:'A',peptide:'C'},{hla:'A',peptide:'C'}];
test('Rigid alignment removes rotation and translation while preserving chirality',()=>{
 const a=[[0,0,0],[2,0,0],[0,3,0],[0,0,4],[1,2,3]];
 const b=a.map(([x,y,z])=>[-y+10,x-4,z+3]);
 const fit=fitRigid(a,b);assert.ok(fit.rmsd<1e-8);
 a.forEach((p,i)=>assert.ok(Math.hypot(...fit.apply(p).map((v,j)=>v-b[i][j]))<1e-8));
 assert.ok(fitRigid(a,a.map(([x,y,z])=>[-x,y,z])).rmsd>.1);
 assert.throws(()=>fitRigid([[0,0,0],[1,0,0],[2,0,0]],[[0,0,0],[1,0,0],[2,0,0]]),/collinear/);
});
test('Published pair preserves mutation identity and measurable neighboring differences',()=>{
 const pair=compareStructures(normal,mutant,roles);
 assert.deepEqual(pair.sequences,['KQWLVWLLL','KQWLVWLFL']);assert.equal(pair.mutationPosition,8);
 // Independent NumPy Kabsch fit over the same 275 observed Cα atoms: 1.02700318 Å.
 assert.equal(pair.alignment.atomCount,275);assert.ok(Math.abs(pair.alignment.rmsd-1.02700318)<1e-6);
 assert.equal(pair.differences[7].sidechain.value,null);assert.equal(pair.differences[7].sidechain.atoms.length,0);
 assert.ok(pair.differences[5].sidechain.value>2);assert.ok(pair.differences[5].backbone.value<1.2);
 for(const pdb of pair.pdbs)assert.deepEqual(parsePdb(pdb).chains.map(c=>c.id),['A','C']);
});
test('PDB ingestion refuses ambiguous comparisons instead of inventing correspondences',()=>{
 assert.throws(()=>parsePdb('hello'),/No supported/);
 const atom=normal.split('\n').find(l=>l.startsWith('ATOM  '));
 assert.throws(()=>parsePdb(atom.slice(0,30)+'        '+atom.slice(38)),/empty coordinates/);
 assert.throws(()=>compareStructures(normal,normal,roles),/exactly one/);
 assert.throws(()=>compareStructures(normal,mutant,[{hla:'A',peptide:'A'},roles[1]]),/different chains/);
 assert.throws(()=>compareStructures(normal,mutant,[{hla:'B',peptide:'C'},roles[1]]),/identical observed HLA/);
 const missing=mutant.split('\n').filter(l=>!(l.startsWith('ATOM')&&l[21]==='A'&&Number(l.slice(22,26))===20)).join('\n');
 assert.throws(()=>compareStructures(normal,missing,roles),/identical observed/);
});
