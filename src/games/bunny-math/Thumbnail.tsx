/** 홈 카드: 징검다리 위를 깡충 뛰는 토끼와 당근 */
export function BunnyMathThumbnail() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden>
      <rect x="6" y="70" width="108" height="34" rx="17" fill="#9ad8ff" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <ellipse cx={22 + i * 25} cy="88" rx="11" ry="7" fill="#d9d2c3" stroke="#8a7f6b" strokeWidth="2" />
          <text x={22 + i * 25} y="92" textAnchor="middle" fontSize="11" fontFamily="Jua, sans-serif" fill="#5c5446">
            {i + 1}
          </text>
        </g>
      ))}
      <path d="M22 76 q12 -18 25 0" fill="none" stroke="#ff8a3d" strokeWidth="3" strokeDasharray="4 3" strokeLinecap="round" />
      <path d="M47 76 q12 -18 25 0" fill="none" stroke="#ff8a3d" strokeWidth="3" strokeDasharray="4 3" strokeLinecap="round" />
      {/* 토끼 */}
      <g transform="translate(58 22)">
        <ellipse cx="8" cy="10" rx="5" ry="14" fill="#fffaf4" stroke="#4a3b5c" strokeWidth="2.5" transform="rotate(-10 8 20)" />
        <ellipse cx="22" cy="10" rx="5" ry="14" fill="#fffaf4" stroke="#4a3b5c" strokeWidth="2.5" transform="rotate(10 22 20)" />
        <circle cx="15" cy="32" r="15" fill="#fffaf4" stroke="#4a3b5c" strokeWidth="2.5" />
        <circle cx="10" cy="31" r="2.2" fill="#4a3b5c" />
        <circle cx="20" cy="31" r="2.2" fill="#4a3b5c" />
        <ellipse cx="6" cy="36" rx="3" ry="2" fill="#ffb3c7" />
        <ellipse cx="24" cy="36" rx="3" ry="2" fill="#ffb3c7" />
        <path d="M12 38 q3 3 6 0" fill="none" stroke="#4a3b5c" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* 당근 */}
      <g transform="translate(14 22) rotate(-25 10 20)">
        <path d="M10 8 L18 8 L14 36 Z" fill="#ff8a3d" stroke="#c45a14" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 8 q-6 -8 -2 -12 M14 8 q0 -9 4 -11 M14 8 q6 -6 9 -4" fill="none" stroke="#3a9d3a" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <text x="96" y="40" fontSize="20" fontFamily="Jua, sans-serif" fill="#7c5cff">+1</text>
    </svg>
  );
}
