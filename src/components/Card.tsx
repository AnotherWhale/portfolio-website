const Card = () => {
  return (
    <div className="z-50 card card-compact w-full card-primary bg-accent shadow-xl">
      <figure>
        <svg viewBox="0 0 480 250" className="w-full" role="img" aria-label="Particle swarm exploring an optimization landscape">
          <rect width="480" height="250" fill="#20161f" />
          {[0,1,2,3,4,5].map(i => <ellipse key={i} cx="240" cy="130" rx={35+i*29} ry={18+i*16} fill="none" stroke={['#fde725','#5ec962','#21918c','#3b528b','#440154','#604b5c'][i]} strokeWidth="2" transform={`rotate(-18 240 130)`} />)}
          <path d="M86 76L145 102L205 121M365 190L302 152L249 127M345 65L286 100L249 127" fill="none" stroke="#8dcac1" strokeDasharray="5 5" opacity=".6" />
          {[[86,76],[145,102],[205,121],[365,190],[302,152],[345,65],[286,100]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="4" fill="#fff" />)}
          <circle cx="249" cy="127" r="7" fill="#fc9581" />
          <text x="22" y="32" fill="#dbc6da" fontSize="14" fontFamily="sans-serif">PSO + SIMULATED ANNEALING</text>
        </svg>
      </figure>
      <div className="card-body">
        <h2 className="card-title">PSO–SA optimization</h2>
        <p>A hybrid algorithm I developed at university. Explore how particles search a landscape with help from simulated annealing.</p>
        <div className="card-actions justify-end">
          <a className="btn btn-ghost" href="https://github.com/AnotherWhale/PSO-SA" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a className="btn btn-primary" href="#/projects/pso-sa">Try visualizer</a>
        </div>
      </div>
    </div>
  );
};

export default Card;
