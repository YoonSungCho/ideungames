/** 홈 카드용: "7 + 8 = ?" 카드와 번개 */
export function QuickMathThumbnail() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden>
      <rect x="6" y="22" width="108" height="76" rx="18" fill="#fff" stroke="#3b3567" strokeWidth="4" />
      <text x="60" y="70" textAnchor="middle" fontSize="30" fontFamily="Jua, sans-serif" fill="#3b3567">
        <tspan fill="#ff7a59">7</tspan>
        <tspan fill="#9b6bff"> + </tspan>
        <tspan fill="#3fa9f5">8</tspan>
        <tspan fill="#3b3567"> =</tspan>
      </text>
      <rect x="84" y="78" width="30" height="30" rx="9" fill="#ffd166" stroke="#3b3567" strokeWidth="3" />
      <text x="99" y="100" textAnchor="middle" fontSize="20" fontFamily="Jua, sans-serif" fill="#3b3567">?</text>
      <path d="M98 0 L88 18 L97 18 L92 34 L108 12 L99 12 L104 0 Z" fill="#ffd166" stroke="#3b3567" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
