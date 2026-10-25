/** 홈 카드용: 뒷면 카드 한 장 + 짝을 찾은 강아지 두 장 */
export function MemoryCardsThumbnail() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden>
      <g transform="rotate(-12 30 66)">
        <rect x="8" y="34" width="44" height="60" rx="10" fill="#9b6bff" stroke="#3b3567" strokeWidth="3.5" />
        <rect x="14" y="40" width="32" height="48" rx="7" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 4" />
        <text x="30" y="72" textAnchor="middle" fontSize="24" fontFamily="Jua, sans-serif" fill="#fff">?</text>
      </g>
      <g transform="rotate(4 60 60)">
        <rect x="38" y="24" width="44" height="60" rx="10" fill="#fff" stroke="#3b3567" strokeWidth="3.5" />
        <text x="60" y="64" textAnchor="middle" fontSize="28">🐶</text>
      </g>
      <g transform="rotate(14 92 70)">
        <rect x="68" y="38" width="44" height="60" rx="10" fill="#fff" stroke="#2ec4a0" strokeWidth="4" />
        <text x="90" y="74" textAnchor="middle" fontSize="15" fontFamily="Jua, sans-serif" fill="#3b3567">강아지</text>
      </g>
      <path d="M98 10 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" fill="#ffd166" stroke="#3b3567" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
