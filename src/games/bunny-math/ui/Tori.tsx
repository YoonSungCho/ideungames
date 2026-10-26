export type ToriMood = 'idle' | 'happy' | 'think' | 'oops' | 'cheer';

const FUR = '#fffaf4';
const LINE = '#4a3b5c';
const PINK = '#ffb3c7';

function Eyes({ mood }: { mood: ToriMood }) {
  if (mood === 'happy' || mood === 'cheer') {
    return (
      <g fill="none" stroke={LINE} strokeWidth="4" strokeLinecap="round">
        <path d="M44 74 q6 -7 12 0" />
        <path d="M64 74 q6 -7 12 0" />
      </g>
    );
  }
  if (mood === 'oops') {
    return (
      <g fill="none" stroke={LINE} strokeWidth="3.5" strokeLinecap="round">
        <path d="M45 69 l9 6 l-9 6" />
        <path d="M75 69 l-9 6 l9 6" />
      </g>
    );
  }
  return (
    <g fill={LINE}>
      <ellipse cx="50" cy="74" rx="5" ry={mood === 'think' ? 5 : 6.5} />
      <ellipse cx="70" cy="74" rx="5" ry={mood === 'think' ? 5 : 6.5} />
      <circle cx="52" cy="71.5" r="1.8" fill="#fff" />
      <circle cx="72" cy="71.5" r="1.8" fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: ToriMood }) {
  if (mood === 'cheer') return <path d="M53 88 q7 11 14 0 z" fill="#e2557a" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />;
  if (mood === 'oops') return <ellipse cx="60" cy="91" rx="4" ry="3.5" fill="#e2557a" stroke={LINE} strokeWidth="2" />;
  if (mood === 'think') return <path d="M55 91 h9" stroke={LINE} strokeWidth="3" strokeLinecap="round" />;
  return <path d="M53 87 q3.5 4 7 0 q3.5 4 7 0" fill="none" stroke={LINE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
}

/** 토끼 토리: 수 길을 깡충깡충 뛰는 주인공 */
export function Tori({ mood = 'idle', size = 80, className }: { mood?: ToriMood; size?: number | string; className?: string }) {
  const earTilt = mood === 'oops' ? 18 : mood === 'cheer' ? -6 : mood === 'think' ? 10 : 0;
  return (
    <svg viewBox="0 0 120 140" width={size} height={typeof size === 'number' ? size * (140 / 120) : undefined} className={className} aria-hidden>
      {/* 귀 */}
      <g transform={`rotate(${-earTilt - 8} 48 50)`}>
        <ellipse cx="46" cy="28" rx="11" ry="28" fill={FUR} stroke={LINE} strokeWidth="3.5" />
        <ellipse cx="46" cy="30" rx="5.5" ry="19" fill={PINK} />
      </g>
      <g transform={`rotate(${earTilt + 8} 72 50)`}>
        <ellipse cx="74" cy="28" rx="11" ry="28" fill={FUR} stroke={LINE} strokeWidth="3.5" />
        <ellipse cx="74" cy="30" rx="5.5" ry="19" fill={PINK} />
      </g>
      {/* 몸 */}
      <ellipse cx="60" cy="122" rx="27" ry="17" fill={FUR} stroke={LINE} strokeWidth="3.5" />
      <ellipse cx="46" cy="134" rx="10" ry="5.5" fill={FUR} stroke={LINE} strokeWidth="3" />
      <ellipse cx="74" cy="134" rx="10" ry="5.5" fill={FUR} stroke={LINE} strokeWidth="3" />
      {/* 머리 */}
      <circle cx="60" cy="80" r="34" fill={FUR} stroke={LINE} strokeWidth="3.5" />
      <ellipse cx="39" cy="86" rx="7" ry="4.5" fill={PINK} opacity="0.8" />
      <ellipse cx="81" cy="86" rx="7" ry="4.5" fill={PINK} opacity="0.8" />
      <Eyes mood={mood} />
      <path d="M57 82 h6 l-3 3.5 z" fill="#ff7aa2" stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
      <Mouth mood={mood} />
      {/* 앞발 (기쁠 땐 번쩍) */}
      {mood === 'cheer' ? (
        <g fill={FUR} stroke={LINE} strokeWidth="3">
          <ellipse cx="28" cy="100" rx="7" ry="10" transform="rotate(-30 28 100)" />
          <ellipse cx="92" cy="100" rx="7" ry="10" transform="rotate(30 92 100)" />
        </g>
      ) : (
        <g fill={FUR} stroke={LINE} strokeWidth="3">
          <ellipse cx="49" cy="113" rx="6.5" ry="5" />
          <ellipse cx="71" cy="113" rx="6.5" ry="5" />
        </g>
      )}
      {mood === 'think' && <text x="94" y="40" fontSize="22" fontFamily="Jua, sans-serif" fill="#7c5cff">?</text>}
    </svg>
  );
}
