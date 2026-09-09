import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowUpRight, Atom, BookOpen, Check, ChevronRight, CircleHelp, Download, Eye, EyeOff, Github, Layers3, RotateCcw, Shuffle, X } from 'lucide-react';
import type { Cohort, Target, Lens, Outcome } from './types';
import { orderTargets } from './lib/statistics.mjs';
import ChanceChart from './components/ChanceChart';
const Molecule = lazy(()=>import('./components/Molecule'));

const names: Record<Outcome,string> = {response:'Response detected',undetected:'Not detected',pooled:'Pool unresolved',missing:'No data'};
const lensNames: Record<Lens,string> = {published:'As published',esm:'ESM-2',binding:'Class-I binding',shuffle:'Shuffle'};
const cleanPatient=(n:number)=>String(n).padStart(2,'0');

function Sequence({target}:{target:Target}) {
  return <div className="sequence" aria-label={`Mutant sequence ${target.mutant}`}>
    {target.mutant.split('').map((aa,i)=><span key={i} className={target.wildtype && target.wildtype[i]!==aa?'changed':''} title={`Position ${i+1}${target.wildtype ? `: ${target.wildtype[i]} → ${aa}`:''}`}>{aa}</span>)}
  </div>;
}

function Evidence({data,onClose}:{data:Cohort;onClose:()=>void}) {
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const dialog=document.querySelector<HTMLElement>('.evidence');
    const nodes=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button,a[href]')??[]);
    nodes()[0]?.focus();
    const f=(e:KeyboardEvent)=>{
      if(e.key==='Escape')onClose();
      if(e.key==='Tab'){
        const all=nodes(),first=all[0],last=all.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
      }
    };
    document.addEventListener('keydown',f);
    return()=>{document.removeEventListener('keydown',f);document.body.style.overflow=overflow;previous?.focus()};
  },[onClose]);
  return <div className="modal-backdrop" onClick={onClose}><section className="evidence" role="dialog" aria-modal="true" aria-label="Evidence and methods" onClick={e=>e.stopPropagation()}>
    <button className="icon-button close" aria-label="Close evidence" onClick={onClose}><X size={20}/></button>
    <span className="eyebrow">SOURCES & METHODS</span><h2>The evidence.</h2>
    <div className="evidence-block"><h3>One selected vaccine cohort</h3><p>232 administered target records from 16 patients in the Rojas pancreatic-cancer trial. These are already selected vaccine targets, not all tumor mutations. “Not detected” means no response detected under this ELISpot assay, not proof of absent immunity.</p><a href="https://www.nature.com/articles/s41586-023-06063-y" target="_blank" rel="noreferrer">Rojas et al. · Nature 2023 <ArrowUpRight size={14}/></a></div>
    <div className="evidence-counts">{(['response','undetected','pooled','missing'] as Outcome[]).map(o=><div key={o}><strong>{data.targets.filter(t=>t.outcome===o).length}</strong><span>{names[o]}</span></div>)}</div>
    <div className="evidence-block"><h3>23 individual positives + 2 positive pools</h3><p>The paper’s 25 reported responses include two pools containing seven targets in patient 25. Pool members and the two missing outcomes remain visible but are excluded from binary outcome analysis. The assay does not resolve CD4/CD8 or HLA class for every response.</p></div>
    <div className="evidence-block"><h3>Two exploratory features</h3><p>ESM-2 650M: log P(mutant) − log P(normal), with the mutation masked in verified wild-type protein context, up to 511 residues. More negative scores appear first. This is a sequence-preference hypothesis, not immune foreignness.</p><p>MHCflurry: predicted affinity for the published best class-I peptide/allele pair; lower nM appears first. Predicted restriction is not experimentally demonstrated restriction. Rankings use the same jointly scored, individually labeled records, within each patient.</p><p>The shaded reference is the central 90% of 2,000 seeded within-patient random orderings. It describes chance ordering, not population uncertainty or clinical efficacy.</p><div className="inline-status"><Check size={14}/> {data.targets.filter(t=>t.comparisonEligible).length} jointly eligible records</div></div>
    <div className="evidence-block"><h3>A separate structural case</h3><p>HHAT L75F, HLA-A*02:06, receptor 302TIL. Four experimental structures; aligned on HLA platform Cα atoms, never the peptide. Normal: 6UJQ / 6UK2. Mutant: 6UJO / 6UK4. This ovarian-cancer example is not a target structure from the pancreatic trial.</p><a href="https://www.nature.com/articles/s41589-020-0610-1" target="_blank" rel="noreferrer">Devlin et al. · Nature Chemical Biology 2020 <ArrowUpRight size={14}/></a></div>
    <div className="evidence-block"><h3>Rosalind contribution</h3><p>Pending independent work in Rosalind Workbench. This build contains local analysis and visualization; no Rosalind execution is claimed.</p></div>
    <a className="download-link" href="/data/cohort.json" download><Download size={15}/> Download records & provenance</a>
    <code className="checksum">SHA-256 {data.sourceSha256}</code>
  </section></div>;
}

export default function App() {
  const [data,setData]=useState<Cohort|null>(null),[error,setError]=useState('');
  const [scene,setScene]=useState<'atlas'|'molecule'>('atlas');
  const [reveal,setReveal]=useState(false),[lens,setLens]=useState<Lens>('published'),[seed,setSeed]=useState(20260909);
  const [patient,setPatient]=useState(10),[targetId,setTargetId]=useState('10:1'),[evidence,setEvidence]=useState(false);
  const reduced=useReducedMotion();
  useEffect(()=>{fetch('/data/cohort.json').then(r=>{if(!r.ok)throw new Error('Dataset unavailable');return r.json()}).then(setData).catch(e=>setError(e.message))},[]);
  const patients=useMemo(()=>data?[...new Set(data.targets.map(t=>t.patient))].sort((a,b)=>a-b):[],[data]);
  const ordered=useMemo(()=>data?new Map(patients.map(p=>[p,orderTargets(data.targets.filter(t=>t.patient===p),lens,seed+p)])):new Map<number,Target[]>(),[data,patients,lens,seed]);
  if(error)return <main className="loading"><h1>Couldn’t load the atlas.</h1><p>{error}</p><button onClick={()=>location.reload()}>Try again</button></main>;
  if(!data)return <main className="loading"><div className="brand-mark"/><span>Opening the atlas…</span></main>;
  const selected= data.targets.find(t=>t.id===targetId) ?? data.targets.find(t=>t.patient===patient)!;
  const patientTargets=ordered.get(patient)??[];
  const hasModels=data.targets.some(t=>t.comparisonEligible);
  const selectPatient=(p:number)=>{setPatient(p);setTargetId(ordered.get(p)![0].id)};
  return <div className="app-shell">
    <header className="topbar">
      <button className="wordmark" onClick={()=>setScene('atlas')} aria-label="Callback home"><span className="brand-mark"/>callback<span className="wordmark-dot">.</span></button>
      <nav aria-label="Explore"><button className={scene==='atlas'?'active':''} onClick={()=>setScene('atlas')}><span>01</span> The vaccines</button><button className={scene==='molecule'?'active':''} onClick={()=>setScene('molecule')}><span>02</span> Recognition</button></nav>
      <div className="header-actions"><span className="live-label"><i/> CANCER VACCINE ATLAS</span><button className="icon-button" title="Evidence and methods" aria-label="Evidence and methods" onClick={()=>setEvidence(true)}><BookOpen size={18}/></button><a className="icon-button github" href="https://github.com/Supernova-45/callback" target="_blank" rel="noreferrer" aria-label="GitHub repository"><Github size={18}/></a></div>
    </header>
    {scene==='atlas'?<main className="atlas-page">
      <section className="intro-bar"><div><h1>What gets <em>seen?</em></h1></div><div className="hero-stats"><div><strong>232</strong><span>selected targets</span></div><div><strong>16</strong><span>patients</span></div></div></section>
      <div className="atlas-layout">
        <aside className="control-rail">
          <div className="lens-buttons">{(['published','esm','binding','shuffle'] as Lens[]).map(l=><button key={l} disabled={l!=='published'&&!hasModels} className={lens===l?'selected':''} onClick={()=>{setLens(l);if(l==='shuffle')setSeed(s=>s+1)}}>{l==='published'?<Layers3 size={16}/>:l==='shuffle'?<Shuffle size={16}/>:<span className="lens-symbol">{l==='esm'?'∑':'⌁'}</span>}<span>{lensNames[l]}</span>{lens===l&&<ChevronRight size={14}/>}</button>)}</div>
          <button className={`reveal-button ${reveal?'revealed':''}`} onClick={()=>setReveal(!reveal)}>{reveal?<EyeOff size={17}/>:<Eye size={17}/>} {reveal?'Hide responses':'Reveal responses'}<ArrowRight size={16}/></button>

        </aside>
        <section className="cohort-panel" aria-label="Vaccine target atlas">
          <div className="panel-heading"><span>Pancreatic cancer <span className="subtle">/ Rojas 2023</span></span><button className="text-button" onClick={()=>setEvidence(true)}><CircleHelp size={13}/>{lens==='published'?'Already selected for vaccination':'Matched targets · response class unresolved'}</button></div>
          <div className="cohort-axis"><span>PATIENT</span><span>{lens==='published'?'PUBLISHED ORDER':lens==='esm'?'ESM PREFERENCE ↑':lens==='binding'?'PREDICTED nM ↑':'RANDOM ORDER'} <ArrowRight size={12}/></span><span>{reveal?'DETECTED':'TARGETS'}</span></div>
          <div className="patient-rows">{patients.map(p=>{const targets=ordered.get(p)!;const active=p===patient;return <div className={`patient-row ${active?'active':''}`} key={p}>
            <button className="patient-number" onClick={()=>selectPatient(p)} aria-label={`Select patient ${p}`} aria-pressed={active}>{cleanPatient(p)}<span>{active?'↗':''}</span></button>
            <div className="target-track">{targets.map(t=><motion.button layout={!reduced} transition={{type:'spring',stiffness:370,damping:32}} key={t.id} className={`target-mark ${reveal?t.outcome:'concealed'} ${selected.id===t.id?'picked':''} ${lens!=='published'&&!t.comparisonEligible?'unranked':''}`} onClick={()=>{setPatient(p);setTargetId(t.id)}} title={`Patient ${p} · ${t.gene} ${t.mutation??''}${reveal?` · ${names[t.outcome]}`:''}${lens!=='published'&&!t.comparisonEligible?' · outside comparison':''}`} aria-label={`Patient ${p}, ${t.gene}, ${t.mutation??'complex variant'}${reveal?`, ${names[t.outcome]}`:''}`}><span/></motion.button>)}</div>
            <div className="patient-total">{reveal?<><b>{targets.filter(t=>t.outcome==='response').length}</b><span>/{targets.length}</span>{p===25&&<sup>+ pools</sup>}</>:<span>{targets.length}</span>}</div>
          </div>})}</div>
          <div className={`legend ${reveal?'':'quiet'}`}>{(['response','undetected','pooled','missing'] as Outcome[]).map(o=><div key={o}><i className={`legend-dot ${o}`}/><span>{names[o]}</span><b>{reveal?data.targets.filter(t=>t.outcome===o).length:'—'}</b></div>)}</div>
          <div className="atlas-footnote"><span><i className="status-ring"/>{lens==='published'?'One mark, one target':`${data.targets.filter(t=>t.comparisonEligible).length} compared · dimmed = excluded`}</span><button className="text-button" onClick={()=>{setLens('published');setReveal(false);setSeed(20260909)}}><RotateCcw size={12}/> Reset</button></div>
        </section>
        <aside className="target-inspector">
          <div className="panel-heading"><span>SELECTED TARGET</span><span className="inspector-coordinate">PT {cleanPatient(patient)} / {selected.number}</span></div>
          <AnimatePresence mode="wait"><motion.div key={selected.id} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.12}}>
            <div className={`target-status ${reveal?selected.outcome:'concealed'}`}><i/>{reveal?names[selected.outcome]:'Response hidden'}</div>
            <h2 className="gene-name">{selected.gene}</h2><div className="mutation-name">{selected.mutation??'Complex variant'}</div>
            <div className="inspector-section"><span className="micro-heading">SEQUENCE</span><Sequence target={selected}/><div className="sequence-key"><i/> mutation</div></div>
            <dl className="target-facts"><div><dt>Predicted class I</dt><dd>{selected.hla1.replace('HLA-','')}</dd></div><div><dt>Predicted class II</dt><dd>{selected.hla2.replace('HLA-','')}</dd></div></dl>
            <div className="score-pair"><div><span>ESM-2</span><strong>{selected.esm===null?'—':selected.esm.toFixed(2)}</strong><small>log preference Δ</small></div><div><span>BINDING</span><strong>{selected.binding===null?'—':selected.binding<1000?selected.binding.toFixed(0):(selected.binding/1000).toFixed(1)+'k'}</strong><small>predicted nM</small></div></div>
            {selected.proteinMapping?.status==='verified'?<div className="mapping-state"><Check size={12}/> Reference verified</div>:<div className="mapping-state unresolved"><CircleHelp size={12}/><span title={selected.proteinMapping?.reason??'Reference mapping pending'}>Reference unresolved</span></div>}
            {reveal&&['pooled','missing'].includes(selected.outcome)&&<p className="record-note">{selected.outcome==='pooled'?'Pooled outcome · not individually resolved.':'No assay result.'} Excluded from comparison.</p>}
          </motion.div></AnimatePresence>
          {lens!=='published'&&reveal&&<ChanceChart targets={patientTargets} visible={reveal}/>}
          <button className="molecule-link" onClick={()=>setScene('molecule')}><div className="mini-orbit"><Atom size={26}/></div><span>Explore in <b>3D</b></span><ArrowUpRight size={19}/></button>
        </aside>
      </div>
      <footer className="page-footer"><span>ROJAS ET AL. / NATURE 2023</span><button onClick={()=>setScene('molecule')}>Explore recognition <ArrowRight size={14}/></button></footer>
    </main>:<Suspense fallback={<div className="loading"><Atom size={30}/><span>Loading experimental structures…</span></div>}><Molecule onEvidence={()=>setEvidence(true)}/></Suspense>}
    {evidence&&<Evidence data={data} onClose={()=>setEvidence(false)}/>}
  </div>;
}
