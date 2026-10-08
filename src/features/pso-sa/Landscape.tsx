import { useEffect, useMemo, useRef, useState } from 'react';
import type { Objective } from './functions';
import type { Snapshot } from './optimizer';
import { viridis } from './palette';

export interface LandscapeProps { objective: Objective; snapshot: Snapshot; logarithmic: boolean; }
export function sampleLandscape(objective: Objective, logarithmic: boolean, resolution = 100) {
  const values = Array.from({length: (resolution+1)**2}, (_,i) => {
    const x = objective.bounds[0][0]+(i%(resolution+1))/resolution*(objective.bounds[0][1]-objective.bounds[0][0]);
    const y = objective.bounds[1][0]+Math.floor(i/(resolution+1))/resolution*(objective.bounds[1][1]-objective.bounds[1][0]);
    return objective.evaluate(x,y);
  });
  const min = Math.min(...values), max = Math.max(...values);
  const range = Math.max(max-min,1e-12);
  const normalize = (value: number) => logarithmic ? Math.log1p(Math.max(0,value-min))/Math.log1p(range) : (value-min)/range;
  return { values, normalize, min, max, resolution };
}

export default function Landscape3D({objective,snapshot,logarithmic}: LandscapeProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const [error,setError] = useState(false);
  const count = snapshot.positions.length;
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    setError(false);
    Promise.all([import('three'),import('three/examples/jsm/controls/OrbitControls.js')]).then(([THREE,{OrbitControls}]) => {
      if (disposed || !host.current) return;
      const container = host.current;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:true}); }
      catch { setError(true); return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      container.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('aria-label','Interactive objective surface. Drag to rotate; pinch or scroll to zoom.');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42,1,.1,100);
      camera.position.set(11,10,13);
      const controls = new OrbitControls(camera,renderer.domElement);
      controls.target.set(0,1,0);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 7; controls.maxDistance = 30;
      controls.maxPolarAngle = Math.PI*.48;
      controls.update();
      const sample = sampleLandscape(objective,logarithmic,80);
      const geometry = new THREE.PlaneGeometry(10,10,80,80);
      geometry.rotateX(-Math.PI/2);
      const positions = geometry.getAttribute('position');
      const colors: number[] = [];
      const map = (v: number,d: number) => (v-objective.bounds[d][0])/(objective.bounds[d][1]-objective.bounds[d][0])*10-5;
      for(let i=0;i<positions.count;i++) {
        const x = objective.bounds[0][0]+(positions.getX(i)+5)/10*(objective.bounds[0][1]-objective.bounds[0][0]);
        const y = objective.bounds[1][0]+(positions.getZ(i)+5)/10*(objective.bounds[1][1]-objective.bounds[1][0]);
        const t = sample.normalize(objective.evaluate(x,y));
        positions.setY(i,t*3);
        const [r,g,b] = viridis(t);
        const color = new THREE.Color(`rgb(${r},${g},${b})`);
        colors.push(color.r,color.g,color.b);
      }
      geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
      geometry.computeVertexNormals();
      const material = new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:.82});
      scene.add(new THREE.Mesh(geometry,material));
      const grid = new THREE.GridHelper(10,10,0x8dcac1,0x42333f);
      grid.position.y = -.06; scene.add(grid);
      const particleGeometry = new THREE.SphereGeometry(.085,10,8);
      const particleMaterial = new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false});
      const particles = new THREE.InstancedMesh(particleGeometry,particleMaterial,count);
      particles.renderOrder=2; particles.frustumCulled=false; scene.add(particles);
      const bestGeometry = new THREE.SphereGeometry(.16,12,10);
      const bestMaterial = new THREE.MeshBasicMaterial({color:0xfc9581,depthTest:false});
      const best = new THREE.Mesh(bestGeometry,bestMaterial); best.renderOrder=3; scene.add(best);
      const dummy = new THREE.Object3D();
      const displayed = latest.current.positions.map(p=>[...p]);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      const resize = () => { const width=container.clientWidth, height=container.clientHeight; renderer.setSize(width,height); camera.aspect=width/Math.max(1,height); camera.updateProjectionMatrix(); };
      const observer = new ResizeObserver(resize); observer.observe(container); resize();
      let visible=true;
      const visibility = new IntersectionObserver(([entry])=>visible=entry.isIntersecting); visibility.observe(container);
      renderer.setAnimationLoop(() => {
        if(document.hidden || !visible) return;
        latest.current.positions.forEach((p,i)=>{
          displayed[i][0]+=(p[0]-displayed[i][0])*(reduced.matches?1:.25);
          displayed[i][1]+=(p[1]-displayed[i][1])*(reduced.matches?1:.25);
          const [x,y]=displayed[i];
          dummy.position.set(map(x,0),sample.normalize(objective.evaluate(x,y))*3+.12,map(y,1));
          dummy.updateMatrix(); particles.setMatrixAt(i,dummy.matrix);
        });
        particles.instanceMatrix.needsUpdate=true;
        const state=latest.current;
        best.position.set(map(state.best[0],0),sample.normalize(state.bestValue)*3+.18,map(state.best[1],1));
        controls.update(); renderer.render(scene,camera);
      });
      const lost = (event: Event) => { event.preventDefault(); setError(true); };
      renderer.domElement.addEventListener('webglcontextlost',lost);
      cleanup = () => {
        renderer.setAnimationLoop(null); observer.disconnect(); visibility.disconnect(); controls.dispose();
        geometry.dispose(); material.dispose(); particleGeometry.dispose(); particleMaterial.dispose(); bestGeometry.dispose(); bestMaterial.dispose();
        grid.geometry.dispose(); (grid.material as InstanceType<typeof THREE.Material>).dispose();
        particles.dispose(); renderer.domElement.removeEventListener('webglcontextlost',lost); renderer.dispose(); renderer.domElement.remove();
      };
    }).catch(()=>{if(!disposed)setError(true);});
    return ()=>{disposed=true;cleanup();};
  },[objective,logarithmic,count]);
  return error ? <div><p className="viz-notice">3D is unavailable on this device. Here’s the 2D view instead.</p><Landscape2D objective={objective} snapshot={snapshot} logarithmic={logarithmic}/></div> : <div className="viz-landscape" ref={host}><span className="viz-axis-note">x · y · height = f(x, y)</span></div>;
}

export function Landscape2D({objective,snapshot,logarithmic}: LandscapeProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useMemo(()=>{
    const sample=sampleLandscape(objective,logarithmic,150);
    const offscreen=document.createElement('canvas'); offscreen.width=151;offscreen.height=151;
    const context=offscreen.getContext('2d');
    if(context) {
      const pixels=context.createImageData(151,151);
      sample.values.forEach((v,i)=>{ const [r,g,b]=viridis(sample.normalize(v)); const row=Math.floor(i/151),col=i%151;const index=((150-row)*151+col)*4; pixels.data.set([r,g,b,255],index); });
      context.putImageData(pixels,0,0);
    }
    return offscreen;
  },[objective,logarithmic]);
  useEffect(()=>{
    if(!canvas.current)return;
    const ctx=canvas.current.getContext('2d');if(!ctx)return;
    ctx.clearRect(0,0,600,440);
    ctx.drawImage(image,80,20,440,370);
    const map=(v:number,d:number)=>(v-objective.bounds[d][0])/(objective.bounds[d][1]-objective.bounds[d][0]);
    snapshot.positions.forEach(([x,y])=>{ctx.beginPath();ctx.arc(80+map(x,0)*440,390-map(y,1)*370,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#120c12';ctx.stroke();});
    ctx.strokeStyle='#fc9581';ctx.lineWidth=3;ctx.beginPath();ctx.arc(80+map(snapshot.best[0],0)*440,390-map(snapshot.best[1],1)*370,8,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#dbc6da';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText(`x: ${objective.bounds[0][0]} → ${objective.bounds[0][1]}`,300,425);
    ctx.save();ctx.translate(35,205);ctx.rotate(-Math.PI/2);ctx.fillText(`y: ${objective.bounds[1][0]} → ${objective.bounds[1][1]}`,0,0);ctx.restore();
  },[image,objective,snapshot]);
  return <canvas className="viz-map" ref={canvas} width={600} height={440} role="img" aria-label={`${objective.name} heatmap with ${snapshot.positions.length} particles and the best point marked in coral`}/>;
}
