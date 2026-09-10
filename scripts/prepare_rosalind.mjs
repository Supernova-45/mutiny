// Publish a small, source-linked UI projection without modifying scientific receipts.
import fs from 'node:fs';
import crypto from 'node:crypto';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const hash = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const mechanism = read('rosalind/mechanism.json');
const evidence = read('rosalind/evidence.json');
const table = read('rosalind/plugin-results/assay-source-check.json');
const labels = [
  ['mutant', 'original', 'Mutant', 'F', 'W', 'HHAT-E1'],
  ['normal', 'original', 'Normal', 'L', 'W', 'HHAT-E1'],
  ['mutant-bta', 'analogue', 'Mutant + W6 analogue', 'F', 'Bta', 'HHAT-E6'],
  ['normal-bta', 'analogue', 'Normal + W6 analogue', 'L', 'Bta', 'HHAT-E6'],
  ['mutant-ala', 'alanine', 'Mutant + W6 alanine', 'F', 'A', 'HHAT-E6'],
  ['normal-ala', 'alanine', 'Normal + W6 alanine', 'L', 'A', 'HHAT-E6'],
  ['p8-ala', 'position8', 'Position 8 alanine', 'A', 'W', 'HHAT-E6'],
];
const expectedLabels = ['HHATp8F (neo)a', 'HHAT (WT)', 'HHATp6B, p8F', 'HHATp6B', 'HHATp6A, p8F', 'HHATp6A', 'HHATp8A'];
const experiments = table.table1.map((row, i) => {
  if (row.peptideLabel !== expectedLabels[i]) throw Error('Published ligand order changed; review adapter mapping.');
  const [id, group, label, p8, p6, claimId] = labels[i];
  return {id, group, label, p8, p6, claimId, sourceLabel: row.peptideLabel,
    value: row.kdMicromolar, sd: row.sdMicromolar, n: row.n, status: row.status,
    temperatureC: row.temperatureC, structureIds: group === 'original' ? (id === 'normal' ? ['6UJQ', '6UK2'] : ['6UJO', '6UK4']) : []};
});
const atoms = id => fs.readFileSync(`public/structures/${id}.pdb`, 'utf8').split('\n')
  .filter(line => line.startsWith('ATOM') && [' ', 'A'].includes(line[16]))
  .map(line => ({chain:line[21], residue:Number(line.slice(22,26)), atom:line.slice(12,16).trim(),
    xyz:[30,38,46].map(n=>Number(line.slice(n,n+8)))}));
const coordinates = Object.fromEntries(mechanism.states.map(s=>[s.id,atoms(s.id)]));
const atomAt = (id, chain, residue, atom) => {
  const matches = coordinates[id].filter(a=>a.chain===chain && a.residue===residue && a.atom===atom);
  if(matches.length!==1) throw Error(`Ambiguous atom ${id}:${chain}:${residue}:${atom}`);
  return matches[0].xyz;
};
const distance = (a,b) => Math.hypot(...a.map((v,i)=>v-b[i]));
const contacts = mechanism.states.filter(s=>s.w6Tyr100Alpha).map(s=>{
  const measurement = s.w6Tyr100Alpha.indoleNitrogenToTyrRingCentroid;
  // Resolve in the existing display PDB frame. Never attach raw-frame endpoints.
  const start = atomAt(s.id,'C',6,'NE1');
  const ring = measurement.endpoints[1].atoms.map(a=>atomAt(s.id,'D',100,a));
  const end = [0,1,2].map(i=>ring.reduce((sum,a)=>sum+a[i],0)/ring.length);
  const displayDistance = distance(start,end);
  if(Math.abs(displayDistance-measurement.value)>.01) throw Error(`Display-frame contact mismatch: ${s.id}`);
  return {state:s.id, start, end, value:measurement.value, displayDistance, unit:'angstrom',
    endpoint:'W6 NE1 → Tyr100α ring centroid', displaySha256:hash(`public/structures/${s.id}.pdb`)};
});
for(const comparison of mechanism.w6Comparisons){
  const [a,b]=comparison.states;
  const displayRmsd=Math.sqrt(comparison.atoms.reduce((sum,name)=>sum+distance(atomAt(a,'C',6,name),atomAt(b,'C',6,name))**2,0)/comparison.atoms.length);
  if(Math.abs(displayRmsd-comparison.rmsd)>.01) throw Error(`Display-frame RMSD mismatch: ${a}/${b}`);
}
const output={schemaVersion:'1.0.0', sourceUrl:table.canonicalUrl, sourceLocation:'Table 1',
  endpoint:'302TIL receptor binding · equilibrium SPR Kᴅ', unit:'μM', experiments,
  comparisons:mechanism.w6Comparisons, contacts, claims:evidence.claims,
  provenance:{adapter:'scripts/prepare_rosalind.mjs',
    inputs:['rosalind/mechanism.json','rosalind/evidence.json','rosalind/plugin-results/assay-source-check.json'].map(path=>({path,sha256:hash(path)})),
    displayFrame:'Existing public/structures PDB coordinates; contact endpoints resolved by exact atom identity and checked against Rosalind geometry to 0.01 Å.',
    literature:'Life Sciences Literature 0.1.5 source retrieval plus separately identified table extraction',
    geometry:'Independent reconstruction; Molecular Structure Viewer 0.1.80 verified atom distances and contacts. Ring RMSD remains a local calculation.'}};
fs.writeFileSync('public/data/hhat-evidence.json',JSON.stringify(output,null,2)+'\n');
fs.mkdirSync('public/research',{recursive:true});
fs.copyFileSync('rosalind/fixtures/hcc1395.project.json','public/research/hcc1395.project.json');
fs.copyFileSync('rosalind/fixtures/sources/pvactools-LICENSE','public/research/pvactools-LICENSE');
console.log('Published seven measured ligand records, four W6 comparisons, two display-frame contacts, and the independent research fixture.');
