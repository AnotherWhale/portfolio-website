// Sampled anchors from Matplotlib's perceptually ordered Viridis colormap.
const stops = [[68,1,84],[59,82,139],[33,145,140],[94,201,98],[253,231,37]];
export function viridis(t: number): [number,number,number] {
  const scaled = Math.max(0,Math.min(1,t))*4;
  const index = Math.min(3,Math.floor(scaled));
  const f = scaled-index;
  return stops[index].map((v,i) => Math.round(v+(stops[index+1][i]-v)*f)) as [number,number,number];
}
