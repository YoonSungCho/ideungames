/** 홈 카드용: 반쯤 칠한 나비 + 붓 */
export function ColoringThumbnail() {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden>
      <g stroke="#3b3567" strokeWidth="3" strokeLinejoin="round">
        <path d="M58 54C36 18 8 26 14 50C18 66 42 66 58 60Z" fill="#9b6bff" />
        <path d="M62 54C84 18 112 26 106 50C102 66 78 66 62 60Z" fill="#fff" />
        <path d="M58 62C38 64 22 80 32 92C42 102 54 84 58 68Z" fill="#ff5fa2" />
        <path d="M62 62C82 64 98 80 88 92C78 102 66 84 62 68Z" fill="#fff" />
        <ellipse cx="60" cy="64" rx="5" ry="22" fill="#6d4c41" />
        <circle cx="34" cy="44" r="7" fill="#ffd166" />
      </g>
      <g transform="rotate(35 92 86)">
        <rect x="86" y="62" width="12" height="40" rx="5" fill="#ffd166" stroke="#3b3567" strokeWidth="3" />
        <path d="M86 62 Q92 44 98 62Z" fill="#ef476f" stroke="#3b3567" strokeWidth="3" strokeLinejoin="round" />
      </g>
      <circle cx="98" cy="22" r="6" fill="#7ed957" stroke="#3b3567" strokeWidth="2.5" />
      <circle cx="112" cy="36" r="4" fill="#3fa9f5" stroke="#3b3567" strokeWidth="2.5" />
    </svg>
  );
}
