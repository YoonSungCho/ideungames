/** 홈 카드: 빛나는 붓과 "가" 글자, 소용돌이 */
export function HangulHeroThumbnail() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden>
      <circle cx="60" cy="60" r="50" fill="#fff" stroke="#3b3567" strokeWidth="4" />
      <path d="M30 86 q-10 -24 8 -38 q16 -10 22 4 q4 10 -8 10" fill="none" stroke="#b18cff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      <text x="62" y="80" textAnchor="middle" fontSize="50" fontFamily="Jua, sans-serif" fill="#3c5fd6">가</text>
      <g transform="rotate(35 92 38)">
        <rect x="88" y="20" width="7" height="44" rx="3.5" fill="#a0522d" />
        <path d="M91.5 20 q8 -12 0 -20 q-8 8 0 20 z" fill="#2f2a55" />
      </g>
      <circle cx="104" cy="16" r="9" fill="#ffd166" opacity="0.85" />
      <text x="20" y="30" fontSize="18" fontFamily="Jua, sans-serif" fill="#ff7a59">ㄱ</text>
      <text x="96" y="104" fontSize="18" fontFamily="Jua, sans-serif" fill="#2ec4a0">ㅏ</text>
    </svg>
  );
}
