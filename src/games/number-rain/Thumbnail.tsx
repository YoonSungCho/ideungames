/** 홈 카드용: 떨어지는 숫자 물방울 + 폭탄 */
export function NumberRainThumbnail() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden>
      <path d="M30 30 a14 14 0 0 1 26 -6 a11 11 0 0 1 18 8 a9 9 0 0 1 -2 18 H34 a10 10 0 0 1 -4 -20 Z" fill="#fff" stroke="#3b3567" strokeWidth="3" />
      <g fontFamily="Jua, sans-serif" textAnchor="middle" fontSize="18">
        <path d="M24 62 q8 -12 16 0 a8 8 0 0 1 -16 0 Z" fill="#3fa9f5" stroke="#3b3567" strokeWidth="3" />
        <text x="32" y="70" fill="#fff">3</text>
        <path d="M84 50 q8 -12 16 0 a8 8 0 0 1 -16 0 Z" fill="#2ec4a0" stroke="#3b3567" strokeWidth="3" />
        <text x="92" y="58" fill="#fff">7</text>
      </g>
      <circle cx="62" cy="86" r="15" fill="#2f2a55" stroke="#3b3567" strokeWidth="3" />
      <path d="M70 73 q6 -8 12 -6" fill="none" stroke="#3b3567" strokeWidth="3" strokeLinecap="round" />
      <circle cx="84" cy="66" r="5" fill="#ffd166" stroke="#ff7a59" strokeWidth="2" />
      <text x="62" y="92" textAnchor="middle" fontSize="15" fontFamily="Jua, sans-serif" fill="#fff">5</text>
      <rect x="0" y="108" width="120" height="12" fill="#8bd46b" />
    </svg>
  );
}
