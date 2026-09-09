import { useEffect, useRef, useState } from 'react';
import * as mol from '3dmol';
import { ArrowUpRight, BookOpen, Check, CircleHelp, Focus, Link2, MousePointer2, RotateCcw, Scan, Sparkles } from 'lucide-react';
import type { Structure, StructureData } from '../types';

const color={hla:'#527b76',normal:'#e9dcb7',mutant:'#d4ee96',mutation:'#f2a279',tcr:'#bbafdc'};

function Viewer({structure,surface,residue,bound,onReady,onPick,resetKey}:{structure:Structure;surface:boolean;residue:number;bound:boolean;onReady:(v:mol.GLViewer)=>void;onPick:(n:number)=>void;resetKey:number}) {
  const div=useRef<HTMLDivElement>(null),viewer=useRef<mol.GLViewer|null>(null),camera=useRef<unknown[]>(null),lastReset=useRef(resetKey),initialView=useRef<unknown[]>(null);
  const [error,setError]=useState(''),[loading,setLoading]=useState(true);
  const ready=useRef(onReady),pick=useRef(onPick);ready.current=onReady;pick.current=onPick;
  useEffect(()=>{
    if(!div.current)return;
    try {
      const v=mol.createViewer(div.current,{backgroundColor:'#112221',antialias:true});
      viewer.current=v;v.setProjection('orthographic');initialView.current=v.getView();ready.current(v);
      const resize=new ResizeObserver(()=>{v.resize();v.render()});resize.observe(div.current);
      return()=>{resize.disconnect();v.clear();div.current?.replaceChildren();viewer.current=null};
    } catch {setError('WebGL is unavailable. Enable hardware acceleration to explore the structures.');}
  },[]);
  useEffect(()=>{
    const v=viewer.current;if(!v)return;
    let cancelled=false;
    camera.current=v.getModel()?v.getView():null;
    setLoading(true);
    fetch(`/structures/${structure.id}.pdb`).then(r=>{if(!r.ok)throw Error('Structure download failed');return r.text()}).then(text=>{
      if(cancelled)return;
      v.clear();v.addModel(text,'pdb');
      v.setStyle({},{});
      v.setStyle({chain:'A',resi:Array.from({length:180},(_,i)=>i+1)},{cartoon:{color:color.hla,opacity:.78}});
      if(bound) for(const chain of ['D','E']) v.setStyle({chain,resi:Array.from({length:115},(_,i)=>i+1)},{cartoon:{color:color.tcr,opacity:.85}});
      const base=structure.state==='normal'?color.normal:color.mutant;
      v.setStyle({chain:'C'},{stick:{radius:.23,color:base},sphere:{scale:.22,color:base}});
      v.setStyle({chain:'C',resi:8},{stick:{radius:.3,color:color.mutation},sphere:{scale:.26,color:color.mutation}});
      v.addStyle({chain:'C',resi:residue},{stick:{radius:.34},sphere:{scale:.29}});
      if(surface){
        v.addSurface(mol.SurfaceType.VDW,{opacity:.72,color:color.hla},{chain:'A',resi:Array.from({length:180},(_,i)=>i+1)});
        v.addSurface(mol.SurfaceType.VDW,{opacity:.62,color:base},{chain:'C',resi:[1,2,3,4,5,6,7,9]});
        v.addSurface(mol.SurfaceType.VDW,{opacity:.85,color:color.mutation},{chain:'C',resi:8});
      }
      v.setClickable({chain:'C'},true,(atom:mol.AtomSpec)=>{if(atom.resi)pick.current(atom.resi)});
      if(camera.current && resetKey===lastReset.current) v.setView(camera.current);
      else {
        if(initialView.current)v.setView(initialView.current,true);
        v.zoomTo({chain:'C'});v.zoom(.66);
        if(bound){v.rotate(62,'x');v.zoom(.7)}
      }
      lastReset.current=resetKey;v.setSlab(-100,100);v.render();setLoading(false);
    }).catch(e=>{if(!cancelled){setError(e.message);setLoading(false)}});
    return()=>{cancelled=true};
  },[structure.id,surface,residue,bound,resetKey]);
  return <div className="structure-stage"><div ref={div} className="molecule-canvas" aria-label={`Interactive ${structure.state} HHAT structure ${structure.id}`}/>{loading&&!error&&<div className="viewer-loading">Loading {structure.id}…</div>}{error&&<div className="viewer-error">{error}<a href={`https://www.rcsb.org/structure/${structure.id}`} target="_blank" rel="noreferrer">Open experimental structure</a></div>}</div>;
}

export default function Molecule({onEvidence}:{onEvidence:()=>void}) {
  const [data,setData]=useState<StructureData|null>(null),[error,setError]=useState('');
  const [bound,setBound]=useState(false),[surface,setSurface]=useState(true),[residue,setResidue]=useState(8),[resetKey,setResetKey]=useState(0);
  const viewers=useRef<(mol.GLViewer|null)[]>([null,null]);
  useEffect(()=>{fetch('/data/structures.json').then(r=>{if(!r.ok)throw Error('Structure data unavailable');return r.json()}).then(setData).catch(e=>setError(e.message))},[]);
  const register=(i:number)=>(v:mol.GLViewer)=>{viewers.current[i]=v;if(viewers.current[0]&&viewers.current[1]){viewers.current[0].linkViewer(viewers.current[1]);viewers.current[1].linkViewer(viewers.current[0]);}};
  if(error)return <main className="loading">{error}</main>;
  if(!data)return <main className="loading">Opening molecular evidence…</main>;
  const structures=[data.structures.find(s=>s.state==='normal'&&s.bound===bound)!,data.structures.find(s=>s.state==='mutant'&&s.bound===bound)!];
  return <main className="molecule-page">
    <section className="intro-bar molecular-intro"><div><div className="eyebrow"><span className="section-index">02 /</span> A SEPARATE EXPERIMENTAL CASE</div><h1>One letter changes.<br/><em>The encounter changes with it.</em></h1></div><div className="case-tag"><span>HHAT</span><strong>L75F</strong><small>HLA-A*02:06 · 302TIL</small></div></section>
    <div className="molecular-workspace">
      <aside className="molecular-rail">
        <span className="eyebrow">THE RECOGNITION INTERFACE</span><h2>Almost the same.<br/><span>Not identical.</span></h2>
        <p className="molecular-context">An ovarian-cancer mutation, captured in four experimental structures.</p>
        <div className="rail-divider"/>
        <span className="rail-kicker">LOOK AT THE SURFACE</span>
        <div className="segmented"><button className={surface?'selected':''} onClick={()=>setSurface(true)}><Scan size={14}/> Surface</button><button className={!surface?'selected':''} onClick={()=>setSurface(false)}><Sparkles size={14}/> Atoms</button></div>
        <span className="rail-kicker second-kicker">ADD THE RECEPTOR</span>
        <button className={`receptor-toggle ${bound?'selected':''}`} aria-pressed={bound} onClick={()=>{setBound(!bound);setResetKey(k=>k+1)}}><span className="toggle-track"><i/></span><span>302TIL receptor</span></button>
        <p className="molecular-hint">{bound?'Switches to receptor-bound experimental structures.':'Peptide presented by HLA, before a receptor is shown.'}</p>
        <div className="molecule-legend"><span><i style={{background:color.hla}}/>HLA platform</span><span><i style={{background:color.normal}}/>Peptide</span><span><i style={{background:color.mutation}}/>Position 8</span>{bound&&<span><i style={{background:color.tcr}}/>T-cell receptor</span>}</div>
        <button className="text-button" onClick={()=>setResetKey(k=>k+1)}><RotateCcw size={13}/> Reset cameras</button>
        <div className="molecular-disclaimer"><Link2 size={15}/><p>This case illustrates recognition. It does not explain the pancreatic-trial outcomes.</p></div>
      </aside>
      <section className="structure-comparison">
        <div className="comparison-topline"><span><Link2 size={13}/> SYNCHRONIZED CAMERAS</span><span><MousePointer2 size={13}/> DRAG TO ROTATE · SCROLL TO ZOOM</span></div>
        <div className="viewer-pair">{structures.map((s,i)=><article className={`structure-card ${s.state}`} key={s.state}>
          <div className="structure-title"><div><span className="eyebrow">{i===0?'01 / NORMAL':'02 / MUTANT'}</span><h3>{i===0?'Self':'Altered self'}</h3></div><a href={`https://www.rcsb.org/structure/${s.id}`} target="_blank" rel="noreferrer">{s.id}<ArrowUpRight size={12}/></a></div>
          <Viewer structure={s} surface={surface} residue={residue} bound={bound} resetKey={resetKey} onReady={register(i)} onPick={setResidue}/>
          <div className="peptide-strip">{s.peptide.split('').map((aa,j)=><button key={j} aria-label={`Inspect peptide position ${j+1}, ${aa}`} aria-pressed={residue===j+1} onClick={()=>setResidue(j+1)} className={`${j===7?'mutation':''} ${residue===j+1?'active':''}`}><span>{aa}</span><small>{j+1}</small></button>)}</div>
          <div className="structure-caption"><span>{s.bound?'RECEPTOR BOUND':'PEPTIDE–HLA'}</span><span>EXPERIMENTAL · X-RAY</span></div>
        </article>)}</div>
        <div className="residue-inspector"><div className="residue-heading"><span className="eyebrow">SELECTED POSITION</span><strong>{String(residue).padStart(2,'0')}</strong><span>{residue===8?'The mutation site':residue===6?'Neighboring tryptophan':'Peptide residue'}</span></div>
          <div className="residue-values">{structures.map(s=>{const r=s.residues.find(r=>r.position===residue)!;return <div key={s.id}><span>{s.state==='normal'?'NORMAL':'MUTANT'} · {r.name}{residue}</span><strong>{r.sasa.toFixed(1)} <small>Å²</small></strong><p>Solvent-accessible area</p>{bound&&<div className="contact-list"><span>{r.contacts.length} receptor residues within 4 Å</span>{r.contacts.slice(0,3).map(c=><small key={c.residue}>{c.residue} <b>{c.distance.toFixed(2)} Å</b></small>)}</div>}</div>})}</div>
          <button className="text-button" onClick={onEvidence}><CircleHelp size={14}/> How measured</button>
        </div>
      </section>
    </div>
    <footer className="page-footer"><span>DEVLIN ET AL. / NATURE CHEMICAL BIOLOGY 2020</span><span>Experimental states. No simulated transition.</span><button onClick={onEvidence}>Open the evidence <BookOpen size={14}/></button></footer>
  </main>;
}
