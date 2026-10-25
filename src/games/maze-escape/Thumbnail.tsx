/** 홈 카드용: 울타리 미로 + 토끼와 당근 */
export function MazeEscapeThumbnail() {
  const walls = 'M12 12 H108 V108 H12 Z M36 12 V60 M60 36 V84 H36 M84 12 V36 M84 60 V108 M12 84 H24 M60 60 H84';
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden>
      <rect x="12" y="12" width="96" height="96" rx="6" fill="#fdf1d2" />
      <path d="M24 24 H24 V96 M24 96 H48 M48 96 V72 M48 72 H72 V48 M72 48 H96 V96" fill="none" stroke="#ffd166" strokeWidth="5" strokeDasharray="1 7" strokeLinecap="round" />
      <path d={walls} fill="none" stroke="#3e8e2a" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 2)" />
      <path d={walls} fill="none" stroke="#6cc04a" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="24" y="31" textAnchor="middle" fontSize="18">🐰</text>
      <text x="96" y="103" textAnchor="middle" fontSize="18">🥕</text>
      <text x="72" y="31" textAnchor="middle" fontSize="13">⭐</text>
    </svg>
  );
}
