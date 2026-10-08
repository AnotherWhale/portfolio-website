import assert from 'node:assert/strict';
import { build } from 'esbuild';

const result = await build({stdin:{contents:'export * from "./src/features/pso-sa/optimizer.ts"; export * from "./src/features/pso-sa/functions.ts";',resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const { Optimizer, defaults, objectives, acceptanceProbability } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const sphere=objectives.find(o=>o.id==='sphere');
const run=(objective,parameters)=>{const engine=new Optimizer(objective,parameters);let state=engine.snapshot();while(!state.done)state=engine.step();return state;};
const parameters={...defaults,particles:25,attempts:10,iterations:60};
const first=run(sphere,parameters),second=run(sphere,parameters);
assert.deepEqual(first,second,'Seeded runs must reproduce exactly');
assert.ok(first.bestValue<1e-5,'Sphere should converge near the origin');
assert.equal(first.steps,600);assert.equal(first.history.length,61);
assert.ok(Math.abs(first.temperature-defaults.temperature*defaults.cooling**60)<1e-10);
assert.equal(sphere.evaluate(...first.best),first.bestValue,'Best position and fitness must correspond');
assert.ok(acceptanceProbability(2,1,100)>acceptanceProbability(2,1,.1),'Cooling should reduce worse-move acceptance');
assert.equal(acceptanceProbability(1,0,0),0);assert.equal(acceptanceProbability(0,0,0),1);
for(const objective of objectives) {
  for(const mode of ['min','max']) {
    const engine=new Optimizer(objective,{...parameters,mode,iterations:10});
    let previous=engine.snapshot().bestValue;
    for(let i=0;i<100;i++) {
      const state=engine.step();
      assert.ok(Number.isFinite(state.bestValue));
      assert.ok(mode==='min'?state.bestValue<=previous:state.bestValue>=previous,'Global best must never worsen');
      previous=state.bestValue;
      for(const point of state.positions)point.forEach((v,d)=>assert.ok(v>=objective.bounds[d][0]&&v<=objective.bounds[d][1],'Particles stay inside bounds'));
      assert.equal(objective.evaluate(...state.best),state.bestValue);
    }
    const finished=engine.snapshot();assert.deepEqual(engine.step(),finished,'Completed runs must not advance');
  }
}
const pso=run(sphere,{...parameters,annealing:false});assert.equal(pso.acceptedWorse,0);
assert.ok(pso.bestValue<1e-5);
const maximized=run(sphere,{...parameters,mode:'max'});assert.ok(maximized.bestValue>49.9);
const stopped=run(sphere,{...parameters,stopAtMinimum:true});assert.ok(stopped.steps<600);assert.ok(stopped.bestValue<=1e-6);
const fixtures={sphere:[0,0],himmelblau:[3,2],rastrigin:[0,0],ackley:[0,0],rosenbrock:[1,1],beale:[3,.5],booth:[1,3],matyas:[0,0],levi:[1,1],camel:[0,0],mccormick:[-.54719,-1.54719],styblinski:[-2.903534,-2.903534]};
for(const objective of objectives)assert.ok(Math.abs(objective.evaluate(...fixtures[objective.id])-objective.minimum)<1e-5,`${objective.name} reference minimum`);
console.log('Passed: 12 function minima, repeatability, convergence, bounds, monotonic best, cooling, SA toggle, maximization, early stopping, completion.');
