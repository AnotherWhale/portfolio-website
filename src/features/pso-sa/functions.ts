export type Point = [number, number];
export interface Objective {
  id: string;
  name: string;
  description: string;
  formula: string;
  bounds: [Point, Point];
  minimum: number;
  evaluate: (x: number, y: number) => number;
}
const pi = Math.PI;
export const objectives: Objective[] = [
  { id: 'himmelblau', name: 'Himmelblau', description: 'Four valleys with equally good minima. The original project’s default.', formula: '(x² + y − 11)² + (x + y² − 7)²', bounds: [[-5, 5], [-5, 5]], minimum: 0, evaluate: (x, y) => (x*x+y-11)**2+(x+y*y-7)**2 },
  { id: 'sphere', name: 'Sphere', description: 'A smooth bowl. A good place to start.', formula: 'x² + y²', bounds: [[-5, 5], [-5, 5]], minimum: 0, evaluate: (x,y) => x*x+y*y },
  { id: 'rastrigin', name: 'Rastrigin', description: 'Many small traps around one global minimum.', formula: '20 + x² − 10 cos(2πx) + y² − 10 cos(2πy)', bounds: [[-5.12,5.12],[-5.12,5.12]], minimum: 0, evaluate: (x,y) => 20+x*x+y*y-10*Math.cos(2*pi*x)-10*Math.cos(2*pi*y) },
  { id: 'ackley', name: 'Ackley', description: 'A rippled landscape with a narrow central basin.', formula: '−20 exp(−0.2√((x²+y²)/2)) − exp((cos(2πx)+cos(2πy))/2) + e + 20', bounds: [[-5,5],[-5,5]], minimum: 0, evaluate: (x,y) => -20*Math.exp(-0.2*Math.sqrt((x*x+y*y)/2))-Math.exp((Math.cos(2*pi*x)+Math.cos(2*pi*y))/2)+Math.E+20 },
  { id: 'rosenbrock', name: 'Rosenbrock', description: 'A long, curved valley that is easy to find but hard to follow.', formula: '(1 − x)² + 100(y − x²)²', bounds: [[-2,2],[-1,3]], minimum: 0, evaluate: (x,y) => (1-x)**2+100*(y-x*x)**2 },
  { id: 'beale', name: 'Beale', description: 'Steep edges and a valley near (3, 0.5).', formula: '(1.5−x+xy)² + (2.25−x+xy²)² + (2.625−x+xy³)²', bounds: [[-4.5,4.5],[-4.5,4.5]], minimum: 0, evaluate: (x,y) => (1.5-x+x*y)**2+(2.25-x+x*y*y)**2+(2.625-x+x*y**3)**2 },
  { id: 'booth', name: 'Booth', description: 'A tilted bowl with its minimum at (1, 3).', formula: '(x + 2y − 7)² + (2x + y − 5)²', bounds: [[-10,10],[-10,10]], minimum: 0, evaluate: (x,y) => (x+2*y-7)**2+(2*x+y-5)**2 },
  { id: 'matyas', name: 'Matyas', description: 'A shallow diagonal valley.', formula: '0.26(x² + y²) − 0.48xy', bounds: [[-10,10],[-10,10]], minimum: 0, evaluate: (x,y) => .26*(x*x+y*y)-.48*x*y },
  { id: 'levi', name: 'Levi N.13', description: 'Wavy valleys leading toward (1, 1).', formula: 'sin²(3πx) + (x−1)²(1+sin²(3πy)) + (y−1)²(1+sin²(2πy))', bounds: [[-10,10],[-10,10]], minimum: 0, evaluate: (x,y) => Math.sin(3*pi*x)**2+(x-1)**2*(1+Math.sin(3*pi*y)**2)+(y-1)**2*(1+Math.sin(2*pi*y)**2) },
  { id: 'camel', name: 'Three-hump camel', description: 'Three local minima in a gently folded surface.', formula: '2x² − 1.05x⁴ + x⁶/6 + xy + y²', bounds: [[-5,5],[-5,5]], minimum: 0, evaluate: (x,y) => 2*x*x-1.05*x**4+x**6/6+x*y+y*y },
  { id: 'mccormick', name: 'McCormick', description: 'An asymmetric valley with a negative minimum.', formula: 'sin(x+y) + (x−y)² − 1.5x + 2.5y + 1', bounds: [[-1.5,4],[-3,4]], minimum: -1.913222954981, evaluate: (x,y) => Math.sin(x+y)+(x-y)**2-1.5*x+2.5*y+1 },
  { id: 'styblinski', name: 'Styblinski–Tang', description: 'Several deep wells; the lowest is away from the origin.', formula: '(x⁴ − 16x² + 5x + y⁴ − 16y² + 5y)/2', bounds: [[-5,5],[-5,5]], minimum: -78.3323314, evaluate: (x,y) => (x**4-16*x*x+5*x+y**4-16*y*y+5*y)/2 },
];
