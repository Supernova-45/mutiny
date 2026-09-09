import { useMemo } from 'react';
import { chanceEnvelope, cumulative } from '../lib/statistics.mjs';
import type { Target } from '../types';

export default function ChanceChart({targets, visible}: {targets: Target[]; visible: boolean}) {
  const comparable = targets.filter(t=>t.comparisonEligible);
  const key = comparable.map(t=>t.id).join(',');
  const band = useMemo(()=>chanceEnvelope(comparable),[key]);
  const positives = comparable.filter(t=>t.outcome==='response').length;
  if (!comparable.length || !positives || positives===comparable.length) return <div className="chance-empty">A chance comparison needs scored targets with both observed outcomes.</div>;
  const x=(i:number)=>26+i/comparable.length*260;
  const y=(n:number)=>103-n/positives*78;
  const line=cumulative(comparable).map((n,i)=>`${x(i)},${y(n)}`).join(' ');
  const area=[...band.map((b,i)=>`${x(i)},${y(b.high)}`),...band.map((b,i)=>`${x(i)},${y(b.low)}`).reverse()].join(' ');
  return <div className={`chance-chart ${visible?'':'masked'}`}>
    <div className="micro-heading">RESPONSES ALONG THIS ORDER <span>{positives} / {comparable.length}</span></div>
    <svg viewBox="0 0 312 133" role="img" aria-label="Cumulative detected responses against the central 90 percent of 2000 within-patient random orderings">
      {[0,positives].map(n=><g key={n}><line x1="26" x2="286" y1={y(n)} y2={y(n)} className="chart-grid"/><text x="10" y={y(n)+4}>{n}</text></g>)}
      <polygon points={area} fill="#627570" opacity=".22"/>
      <polyline points={band.map((b,i)=>`${x(i)},${y(b.mean)}`).join(' ')} stroke="#859690" strokeDasharray="3 4" fill="none"/>
      <polyline points={line} stroke="#d5ed9c" strokeWidth="2" fill="none"/>
      <text x="26" y="123">FIRST</text><text x="253" y="123">LAST</text>
    </svg>
    <div className="chart-caption"><i/> 90% shuffle range · 2,000 orderings</div>
  </div>;
}
