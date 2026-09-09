// Deterministic within-patient randomization. No cross-patient label permutation.
export function randomGenerator(seed) {
  return () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function shuffle(items, seed) {
  const a = [...items], random = randomGenerator(seed);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function orderTargets(targets, lens, seed = 20260909) {
  if (lens === 'published') return [...targets];
  const eligible = targets.filter(t => t.comparisonEligible);
  const rest = targets.filter(t => !t.comparisonEligible);
  if (lens === 'shuffle') return [...shuffle(eligible, seed), ...rest];
  return [...eligible.sort((a,b) => a[lens]-b[lens] || a.id.localeCompare(b.id)), ...rest];
}
export function cumulative(items) {
  let n = 0;
  return [0, ...items.map(t => (n += t.outcome === 'response' ? 1 : 0))];
}
export function chanceEnvelope(items, seed = 20260909, replicates = 2000) {
  const canonical = [...items].sort((a,b)=>a.id.localeCompare(b.id));
  const curves = Array.from({length:replicates}, (_,i) => cumulative(shuffle(canonical, seed+i)));
  return Array.from({length:items.length+1}, (_,k) => {
    const values = curves.map(c=>c[k]).sort((a,b)=>a-b);
    return { low: values[Math.floor((replicates-1)*.05)], high: values[Math.floor((replicates-1)*.95)], mean: values.reduce((a,b)=>a+b,0)/replicates };
  });
}
