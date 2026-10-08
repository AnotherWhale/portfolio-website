import type { Objective, Point } from './functions';

export interface Parameters {
  particles: number; iterations: number; attempts: number;
  inertia: number; cognitive: number; social: number;
  temperature: number; cooling: number; seed: number;
  mode: 'min' | 'max'; annealing: boolean; stopAtMinimum: boolean;
}
export const defaults: Parameters = { particles: 10, iterations: 100, attempts: 100, inertia: .85, cognitive: 1, social: 2, temperature: 100, cooling: .8, seed: 42, mode: 'min', annealing: true, stopAtMinimum: false };
interface Particle { position: Point; velocity: Point; attractor: Point; attractorValue: number; energy: number; accepted: number; }
export interface Snapshot { positions: Point[]; best: Point; bestValue: number; temperature: number; iteration: number; attempt: number; steps: number; acceptedWorse: number; done: boolean; history: number[]; }
export function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function acceptanceProbability(delta: number, averageEnergy: number, temperature: number) {
  if (delta === 0) return 1;
  if (temperature <= 0) return 0;
  return Math.exp(-delta / (Math.max(averageEnergy, 1e-12) * temperature));
}
export class Optimizer {
  private swarm: Particle[];
  private random: () => number;
  private best: Point = [0,0];
  private bestValue: number;
  private temperature: number;
  private steps = 0;
  private acceptedWorse = 0;
  private history: number[] = [];
  private finished = false;
  constructor(readonly objective: Objective, readonly parameters: Parameters) {
    this.random = seededRandom(parameters.seed);
    this.temperature = parameters.temperature;
    this.bestValue = parameters.mode === 'min' ? Infinity : -Infinity;
    this.swarm = Array.from({ length: parameters.particles }, () => {
      const position = objective.bounds.map(([lo,hi]) => lo+this.random()*(hi-lo)) as Point;
      const value = objective.evaluate(...position);
      this.record(position, value);
      return { position, velocity: [this.random()*2-1, this.random()*2-1], attractor: [...position] as Point, attractorValue: value, energy: 1, accepted: 1 };
    });
    // A finite energy scale avoids the infinite initial fitness in the Python prototype.
    const scale = Math.max(1e-12, this.swarm.reduce((sum,p) => sum+Math.abs(p.attractorValue-this.bestValue),0)/this.swarm.length);
    this.swarm.forEach(p => p.energy = scale);
    this.history.push(this.bestValue);
  }
  private better(a: number, b: number) { return this.parameters.mode === 'min' ? a < b : a > b; }
  private record(position: Point, value: number) {
    if (this.better(value,this.bestValue)) { this.bestValue = value; this.best = [...position]; }
  }
  step(): Snapshot {
    if (this.finished) return this.snapshot();
    const p = this.parameters;
    for (const particle of this.swarm) {
      for (let d = 0; d < 2; d++) {
        particle.velocity[d] = p.inertia*particle.velocity[d] + p.cognitive*this.random()*(particle.attractor[d]-particle.position[d]) + p.social*this.random()*(this.best[d]-particle.position[d]);
        const [lo,hi] = this.objective.bounds[d];
        particle.position[d] = Math.max(lo,Math.min(hi,particle.position[d]+particle.velocity[d]));
      }
    }
    // Evaluate every displayed position before recording or plotting it.
    for (const particle of this.swarm) {
      const value = this.objective.evaluate(...particle.position);
      const delta = Math.abs(value-particle.attractorValue);
      const better = this.better(value,particle.attractorValue);
      if (better || (p.annealing && this.random() < acceptanceProbability(delta,particle.energy,this.temperature))) {
        if (!better && delta > 0) this.acceptedWorse++;
        particle.attractor = [...particle.position];
        particle.attractorValue = value;
        particle.accepted++;
        particle.energy += (delta-particle.energy)/particle.accepted;
      }
      this.record(particle.position,value);
    }
    this.steps++;
    if (this.steps % p.attempts === 0) {
      this.temperature *= p.cooling;
      this.history.push(this.bestValue);
    }
    this.finished = this.steps >= p.iterations*p.attempts || (p.stopAtMinimum && p.mode === 'min' && Math.abs(this.bestValue-this.objective.minimum) <= 1e-6);
    if (this.finished && this.steps % p.attempts !== 0) this.history.push(this.bestValue);
    return this.snapshot();
  }
  snapshot(): Snapshot {
    return { positions: this.swarm.map(p => [...p.position] as Point), best: [...this.best], bestValue: this.bestValue, temperature: this.temperature, iteration: Math.floor(this.steps/this.parameters.attempts), attempt: this.steps % this.parameters.attempts, steps: this.steps, acceptedWorse: this.acceptedWorse, done: this.finished, history: [...this.history] };
  }
}
