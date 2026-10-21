/** 홈 카드용 미니 4x4 스도쿠 그림 */
export function SudokuThumbnail() {
  const nums = [1, 0, 0, 4, 0, 4, 1, 0, 0, 1, 4, 0, 4, 0, 0, 1];
  const colors = ['', '#ff6b6b', '#4cc9f0', '#06d6a0', '#7c6cf2'];
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden>
      <rect x="4" y="4" width="112" height="112" rx="18" fill="#fff" stroke="#3b3567" strokeWidth="4" />
      {nums.map((n, i) => {
        const x = 10 + (i % 4) * 25 + (i % 4 >= 2 ? 2 : 0);
        const y = 10 + Math.floor(i / 4) * 25 + (Math.floor(i / 4) >= 2 ? 2 : 0);
        return (
          <g key={i}>
            <rect x={x} y={y} width="23" height="23" rx="6" fill={n ? '#f4f1ff' : '#fafafa'} />
            {n > 0 && (
              <text x={x + 11.5} y={y + 17} textAnchor="middle" fontSize="16" fontFamily="Jua, sans-serif" fill={colors[n]}>
                {n}
              </text>
            )}
          </g>
        );
      })}
      <line x1="60" y1="10" x2="60" y2="110" stroke="#3b3567" strokeWidth="3" />
      <line x1="10" y1="60" x2="110" y2="60" stroke="#3b3567" strokeWidth="3" />
    </svg>
  );
}
