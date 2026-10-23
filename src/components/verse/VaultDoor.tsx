// The Bank vault: steel frame, gold rim, locking bolts and a spinning wheel
export function VaultDoor({ className = "", spinning = true }: { className?: string; spinning?: boolean }) {
  const bolts = Array.from({ length: 12 }, (_, i) => (i * Math.PI * 2) / 12);
  const spokes = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="The vault">
      <defs>
        <radialGradient id="steel" cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#f1eefe" />
          <stop offset="0.45" stopColor="#b8b3d6" />
          <stop offset="1" stopColor="#6c6596" />
        </radialGradient>
        <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a83bd" />
          <stop offset="1" stopColor="#47407a" />
        </linearGradient>
        <radialGradient id="goldrim" cx="0.4" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#fff2a6" />
          <stop offset="0.5" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#d18f00" />
        </radialGradient>
      </defs>

      <rect x="14" y="14" width="372" height="372" rx="44" fill="url(#frame)" stroke="#160f2e" strokeWidth="8" />
      {[
        [48, 48],
        [352, 48],
        [48, 352],
        [352, 352],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="10" fill="#d9d4f5" stroke="#160f2e" strokeWidth="5" />
      ))}

      <circle cx="200" cy="200" r="160" fill="#160f2e" />
      <circle cx="200" cy="200" r="152" fill="url(#goldrim)" stroke="#160f2e" strokeWidth="6" />
      <circle cx="200" cy="200" r="132" fill="url(#steel)" stroke="#160f2e" strokeWidth="6" />

      {bolts.map((a, i) => (
        <circle key={i} cx={(200 + Math.cos(a) * 142).toFixed(2)} cy={(200 + Math.sin(a) * 142).toFixed(2)} r="6" fill="#fff6c8" stroke="#160f2e" strokeWidth="3.5" />
      ))}

      <circle cx="200" cy="200" r="104" fill="none" stroke="#160f2e" strokeWidth="3" strokeDasharray="4 9" opacity="0.45" />

      <g className={spinning ? "dial" : ""}>
        {spokes.map((deg) => (
          <g key={deg} transform={`rotate(${deg} 200 200)`}>
            <rect x="193" y="96" width="14" height="80" rx="7" fill="#d9d4f5" stroke="#160f2e" strokeWidth="5" />
            <circle cx="200" cy="96" r="13" fill="url(#goldrim)" stroke="#160f2e" strokeWidth="5" />
          </g>
        ))}
        <circle cx="200" cy="200" r="42" fill="url(#goldrim)" stroke="#160f2e" strokeWidth="6" />
        <circle cx="200" cy="200" r="28" fill="#836ef9" stroke="#160f2e" strokeWidth="5" />
        <text x="200" y="212" textAnchor="middle" fontFamily="var(--font-nunito)" fontWeight="900" fontSize="34" fill="#fff" stroke="#160f2e" strokeWidth="2.5" paintOrder="stroke">
          $
        </text>
      </g>

      <path d="M95 120 Q120 80 165 70" stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  );
}
