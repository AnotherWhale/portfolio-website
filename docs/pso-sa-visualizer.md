# PSO–SA visualizer

Open `/#/projects/pso-sa`, or select **Try visualizer** in the portfolio. Hash routing works on static hosts without rewrite rules. React loads this page on demand; Three.js and OrbitControls load when the 3D view mounts.

## Files

- `src/features/pso-sa/functions.ts`: typed, two-variable benchmark definitions and domains.
- `optimizer.ts`: deterministic simulation independent of React and rendering.
- `Landscape.tsx`: Three.js surface and canvas heatmap. GPU resources, observers, controls and animation loops are disposed on unmount. WebGL failure falls back to 2D.
- `palette.ts`: sampled Viridis palette, shared by both views.
- `Visualizer.tsx` and `visualizer.css`: controls, playback, metrics and responsive layout.
- `tests/optimizer.test.mjs`: numerical invariants and benchmark fixtures. Run `node tests/optimizer.test.mjs`.

## Adaptation of the university project

Source: https://github.com/AnotherWhale/PSO-SA and the supplied Python file.

The browser implementation preserves inertia, cognitive/social pulls, clamped boundaries, temperature levels, repeated attempts, cooling, and the acceptance probability `exp(-abs(delta)/(averageEnergy*temperature))`. Personal attractors may accept worse values; global best never worsens. Default parameters match the supplied code. The browser uses a seeded PRNG, rather than Python's generator.

Intentional fixes: personal positions are copied rather than aliased to moving positions; initial personal fitness is finite; the initial energy scale is the mean absolute fitness gap to the initial global best (with a positive floor); new positions are evaluated before displaying them, including the final move. Accepted energy is updated using the source's running-average rule. Early stopping uses tolerance `1e-6`, rather than exact floating-point equality. Min/max labels follow the Python comparison operators (the repository README reverses those labels).

Benchmark definitions use standard two-variable forms, correcting the supplied commented Beale and Levi expressions and adapting the higher-dimensional Sphere, Rastrigin, Rosenbrock and Styblinski–Tang examples to two variables. Formula reference: https://www.sfu.ca/~ssurjano/optimization.html.

## Rendering and performance

3D means a surface `z=f(x,y)` for two input variables, not a search in three decision variables. Surface sampling is approximate. The optional log height/color transformation is `log(1+f-sampledMin)` normalized over the sampled range; reported fitness always uses the original function. Viridis anchors are sampled from the established Matplotlib colormap. White particles and a coral global-best marker are separate from surface colors.

One simulation move updates the entire swarm. The timer processes bounded batches (at most 50 moves of 100 particles per tick), without precomputing a full run. Hidden tabs pause computation. Rendering uses a bounded mesh, instanced particle geometry, capped pixel ratio, and skips frames when offscreen/hidden. Particle interpolation affects presentation only; numerical metrics always represent actual simulation states. Reduced-motion preference disables particle interpolation. On narrow screens the simulation appears above settings, and page scrolling remains available outside the 3D canvas.

Validation is numerical tests and a production TypeScript/Vite build. Browser-control tests are deliberately omitted at the user's request.
