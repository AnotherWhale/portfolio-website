import { useEffect, useRef, useState } from 'react';
import { objectives } from './functions';
import { defaults, Optimizer } from './optimizer';
import type { Parameters, Snapshot } from './optimizer';
import Landscape3D, { Landscape2D } from './Landscape';
import './visualizer.css';

const controls: { key: keyof Parameters; name: string; min: number; max: number; step: number; hint: string }[] = [
  {key:'particles',name:'Particles',min:5,max:100,step:1,hint:'How many candidate solutions explore the landscape.'},
  {key:'iterations',name:'Temperature levels',min:10,max:300,step:1,hint:'Number of outer iterations in the original algorithm.'},
  {key:'attempts',name:'Moves per level',min:1,max:100,step:1,hint:'Swarm updates before the temperature cools.'},
  {key:'inertia',name:'Inertia · w',min:0,max:1.2,step:.05,hint:'How much of each particle’s velocity is carried forward.'},
  {key:'cognitive',name:'Personal pull · c₁',min:0,max:3,step:.1,hint:'Pull toward a particle’s accepted personal position.'},
  {key:'social',name:'Swarm pull · c₂',min:0,max:3,step:.1,hint:'Pull toward the best position found by the whole swarm.'},
  {key:'temperature',name:'Initial temperature',min:.1,max:200,step:.1,hint:'Higher values make worse solutions easier to accept.'},
  {key:'cooling',name:'Cooling multiplier',min:.5,max:.99,step:.01,hint:'Temperature is multiplied by this after each level.'},
];
const format = (n: number) => Math.abs(n) < .0001 && n !== 0 ? n.toExponential(3) : n.toLocaleString(undefined,{maximumFractionDigits:5});
function Convergence({history}: {history: number[]}) {
  const lo=Math.min(...history),hi=Math.max(...history),span=Math.max(hi-lo,1e-12);
  const points=history.map((v,i)=>`${40+i/Math.max(1,history.length-1)*620},${130-(v-lo)/span*100}`).join(' ');
  return <div className="viz-chart"><div className="viz-panel-heading"><h2>Best value over time</h2><span>one point per temperature level</span></div><svg viewBox="0 0 700 165" role="img" aria-label={`Best objective value changed from ${format(history[0])} to ${format(history[history.length-1])}`}>
    <path d="M40 25V130H660" fill="none" stroke="#604b5c"/>
    <polyline points={points} stroke="#fc9581" strokeWidth="2.5" fill="none"/>
    <circle cx={history.length===1?40:660} cy={130-(history[history.length-1]-lo)/span*100} r="4" fill="#fc9581"/>
    <text x="40" y="17">{format(hi)}</text><text x="40" y="152">{format(lo)}</text><text x="660" y="152" textAnchor="end">Level {history.length-1}</text>
  </svg></div>;
}
export default function Visualizer() {
  const [objective,setObjective]=useState(objectives[0]);
  const [parameters,setParameters]=useState<Parameters>({...defaults});
  const [initialEngine]=useState(()=>new Optimizer(objectives[0],defaults));
  const engine=useRef(initialEngine);
  const [snapshot,setSnapshot]=useState<Snapshot>(()=>engine.current.snapshot());
  const [running,setRunning]=useState(false);
  const [speed,setSpeed]=useState(200);
  const [view,setView]=useState<'3d'|'2d'>('3d');
  const [logarithmic,setLogarithmic]=useState(true);
  useEffect(()=>{
    if(!running)return;
    const timer=window.setInterval(()=>{
      if(document.hidden)return;
      let next=engine.current.snapshot();
      for(let i=0;i<Math.max(1,Math.round(speed/20)) && !next.done;i++)next=engine.current.step();
      setSnapshot(next);
      if(next.done)setRunning(false);
    },50);
    return ()=>window.clearInterval(timer);
  },[running,speed]);
  useEffect(()=>{const previous=document.title;document.title='PSO–SA visualizer · Mustafa Turner';window.scrollTo(0,0);return()=>{document.title=previous;};},[]);
  const reset=(nextParameters=parameters,nextObjective=objective)=>{
    setRunning(false);setParameters(nextParameters);setObjective(nextObjective);
    engine.current=new Optimizer(nextObjective,nextParameters);setSnapshot(engine.current.snapshot());
  };
  const change=<K extends keyof Parameters>(key:K,value:Parameters[K])=>reset({...parameters,[key]:value});
  const progress=snapshot.steps/(parameters.iterations*parameters.attempts)*100;
  return <main className="viz-page">
    <nav className="viz-topbar"><a href="#/">← Back to portfolio</a><a href="https://github.com/AnotherWhale/PSO-SA" target="_blank" rel="noreferrer">Source on GitHub ↗</a></nav>
    <header className="viz-header"><span className="viz-eyebrow">University project · Interactive demo</span><h1>PSO–SA playground</h1><p>Watch a swarm search for a better solution. Change the landscape, adjust the parameters, and see what happens.</p></header>
    <div className="viz-layout">
      <aside className="viz-settings" aria-label="Algorithm settings">
        <h2>Set up the search</h2>
        <label className="viz-field"><span>Objective function</span><select value={objective.id} onChange={e=>reset(parameters,objectives.find(o=>o.id===e.target.value)!)}>{objectives.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
        <p className="viz-description">{objective.description}</p>
        <label className="viz-field"><span>Goal</span><select value={parameters.mode} onChange={e=>change('mode',e.target.value as 'min'|'max')}><option value="min">Minimize</option><option value="max">Maximize within bounds</option></select></label>
        <p className="viz-setting-note">Changing a search setting resets the run.</p>
        {controls.slice(0,3).map(control=><label className="viz-field" key={control.key}><span>{control.name}<output>{parameters[control.key]}</output></span><input type="range" min={control.min} max={control.max} step={control.step} value={Number(parameters[control.key])} onChange={e=>change(control.key,Number(e.target.value))}/><small>{control.hint}</small></label>)}
        <details className="viz-advanced" open><summary>PSO & annealing parameters</summary>
          {controls.slice(3).map(control=><label className="viz-field" key={control.key}><span>{control.name}<output>{parameters[control.key]}</output></span><input type="range" min={control.min} max={control.max} step={control.step} value={Number(parameters[control.key])} onChange={e=>change(control.key,Number(e.target.value))}/><small>{control.hint}</small></label>)}
          <label className="viz-check"><input type="checkbox" checked={parameters.annealing} onChange={e=>change('annealing',e.target.checked)}/>Accept worse personal solutions (SA)</label>
          <label className="viz-check"><input type="checkbox" checked={parameters.stopAtMinimum} disabled={parameters.mode==='max'} onChange={e=>change('stopAtMinimum',e.target.checked)}/>Stop near the known minimum (±10⁻⁶)</label>
          <label className="viz-field"><span>Random seed</span><input type="number" min={0} max={999999} step={1} value={parameters.seed} onChange={e=>change('seed',Math.max(0,Math.min(999999,Math.floor(Number(e.target.value)||0))))}/><small>The same settings and seed reproduce the same run.</small></label>
        </details>
        <button className="btn btn-ghost viz-defaults" onClick={()=>reset({...defaults})}>Restore original parameters</button>
      </aside>
      <div className="viz-workspace">
        <section className="viz-stage">
          <div className="viz-panel-heading"><div><h2>{objective.name}</h2><span>{snapshot.done?'Finished':running?'Searching…':snapshot.steps?'Paused':'Ready to explore'}</span></div><div className="viz-view-toggle" role="group" aria-label="Landscape view"><button aria-pressed={view==='3d'} onClick={()=>setView('3d')}>3D surface</button><button aria-pressed={view==='2d'} onClick={()=>setView('2d')}>2D map</button></div></div>
          <div className="viz-formula">f(x, y) = {objective.formula}</div>
          {view==='3d'?<Landscape3D objective={objective} snapshot={snapshot} logarithmic={logarithmic}/>:<Landscape2D objective={objective} snapshot={snapshot} logarithmic={logarithmic}/>}
          <div className="viz-legend"><span><i className="viz-dot"/>Particle</span><span><i className="viz-dot viz-best"/>Best found</span><span className="viz-scale">Low <i/> High</span></div>
          <div className="viz-stage-foot"><span>{view==='3d'?'Drag to rotate · pinch or scroll to zoom':'Top view · x and y are the search variables'}</span><label className="viz-check"><input type="checkbox" checked={logarithmic} onChange={e=>setLogarithmic(e.target.checked)}/>Log-scaled landscape</label></div>
          <p className="viz-scaling-note">{logarithmic?'Height and color use log(1 + f − sampled minimum) to reveal the valleys.':'Height and color are linearly scaled over the sampled landscape.'} Objective values below are unscaled.</p>
        </section>
        <section className="viz-playback" aria-label="Playback controls"><div className="viz-buttons"><button className="btn btn-primary" disabled={snapshot.done} onClick={()=>setRunning(!running)}>{running?'Pause':snapshot.steps?'Resume':'Run simulation'}</button><button className="btn btn-outline" disabled={running||snapshot.done} onClick={()=>setSnapshot(engine.current.step())}>Step</button><button className="btn btn-ghost" onClick={()=>reset()}>Reset</button></div><label className="viz-speed">Playback <input aria-label="Playback speed" type="range" min={20} max={1000} step={20} value={speed} onChange={e=>setSpeed(Number(e.target.value))}/><output>{speed} moves/s</output></label><progress max={100} value={progress} aria-label="Simulation progress"/><p>Level {snapshot.iteration} / {parameters.iterations} · Move {snapshot.attempt} / {parameters.attempts}{snapshot.done&&progress<100?' · Known minimum reached':''}</p></section>
        <section className="viz-stats" aria-label="Current results"><div><span>Best objective</span><strong>{format(snapshot.bestValue)}</strong></div><div><span>Best position · x, y</span><strong>{snapshot.best.map(format).join(', ')}</strong></div><div><span>Temperature</span><strong>{format(snapshot.temperature)}</strong></div><div><span>Worse moves accepted</span><strong>{snapshot.acceptedWorse}</strong></div></section>
        <Convergence history={snapshot.history}/>
        <details className="viz-explanation">
          <summary>What am I looking at?</summary>
          <p>This started as a university group project. We were asked to create an optimization algorithm, and our group decided to combine Particle Swarm Optimization (PSO) with Simulated Annealing (SA). This visualizer lets you experiment with that idea.</p>
          <h3>Particle Swarm Optimization</h3>
          <p>PSO searches with a group of candidate solutions called particles—the white dots you see here. Each particle moves through the search space, carrying some momentum and following two clues: a promising position it has found itself, and the best position found by the group. Sharing that information can help the swarm find good solutions quickly, but it can also pull everyone into the same local optimum before they explore elsewhere.</p>
          <h3>Simulated Annealing</h3>
          <p>SA allows the search to accept a worse solution sometimes, rather than always taking an improvement. A “temperature” controls how willing it is to do that. At higher temperatures, the search is more adventurous; as the temperature cools, it becomes more selective. Those occasional worse moves can help it leave a local optimum.</p>
          <h3>Why combine them?</h3>
          <p>Our idea was to use PSO’s shared search to find promising areas, while SA gives individual particles a chance to explore beyond them. In this version, annealing decides whether a particle accepts a new personal position, even if its value is worse. That changes where its personal pull points on the next move. The best solution found by the whole swarm is still kept separately.</p>
          <p>In theory, this balances exploration with the swarm’s tendency to converge. It does not guarantee a better result on every function—that depends on the landscape and the parameters. Try switching SA off, then repeat the run with the same seed to compare.</p>
          <h3>Reading the visualizer</h3>
          <p>The surface represents f(x, y): x and y are the two inputs, and height represents the function’s value. The coral marker shows the best solution found so far, and the chart tracks its value over time. {parameters.mode==='min'?`The known minimum for ${objective.name} is approximately ${format(objective.minimum)}.`:'In maximize mode, the swarm searches for the highest value inside the displayed bounds.'}</p>
          <p>You can find our original Python implementation on <a href="https://github.com/AnotherWhale/PSO-SA" target="_blank" rel="noreferrer">GitHub</a>.</p>
        </details>
      </div>
    </div>
  </main>;
}
