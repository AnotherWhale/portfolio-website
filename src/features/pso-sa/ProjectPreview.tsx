const contours = ["#574152", "#567785", "#338b8c", "#6eaf93", "#b0c789", "#f0bc88"];
const particles = [[78, 80], [130, 99], [173, 106], [333, 127], [286, 117], [290, 43], [256, 71]];

export default function ProjectPreview() {
  return (
    <svg viewBox="0 0 420 200" role="img" aria-label="Contour preview of particles finding a minimum">
      <g fill="none" strokeWidth="1.6" transform="rotate(-15 210 100)">
        {contours.map((color, index) => (
          <ellipse key={color} cx="210" cy="100" rx={151 - index * 26} ry={69 - index * 12} stroke={color} />
        ))}
      </g>
      <path d="M78 80L130 99L173 106M333 127L286 117L245 103M290 43L256 71L233 90" fill="none" stroke="#b7ccc9" strokeDasharray="4 5" />
      <g fill="#f8edf6">
        {particles.map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.5" />)}
      </g>
      <circle cx="210" cy="100" r="6" fill="#f0bc88" />
    </svg>
  );
}
