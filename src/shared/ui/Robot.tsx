import styles from './Robot.module.css';

export type RobotMood = 'idle' | 'happy' | 'cheer' | 'think' | 'oops';

interface RobotProps {
  mood?: RobotMood;
  size?: number;
  className?: string;
}

/** 이든 게임즈 마스코트 '띠봇'. 표정(mood)에 따라 눈/입/팔이 바뀐다. */
export function Robot({ mood = 'idle', size = 120, className }: RobotProps) {
  const armsUp = mood === 'cheer';
  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      className={[styles.robot, styles[mood], className].filter(Boolean).join(' ')}
      role="img"
      aria-label="로봇 친구 띠봇"
    >
      {/* 안테나 */}
      <line x1="100" y1="18" x2="100" y2="46" stroke="var(--robot-dark)" strokeWidth="6" strokeLinecap="round" />
      <circle className={styles.antenna} cx="100" cy="16" r="11" fill="var(--robot-accent)" />

      {/* 팔: 어깨를 축으로 회전 */}
      <rect x="28" y="146" width="16" height="44" rx="8" fill="var(--robot-body)" stroke="var(--robot-dark)" strokeWidth="4"
        className={styles.armL} transform={armsUp ? 'rotate(150 36 152)' : 'rotate(12 36 152)'} />
      <rect x="156" y="146" width="16" height="44" rx="8" fill="var(--robot-body)" stroke="var(--robot-dark)" strokeWidth="4"
        className={styles.armR} transform={armsUp ? 'rotate(-150 164 152)' : 'rotate(-12 164 152)'} />

      {/* 몸통 */}
      <rect x="48" y="140" width="104" height="66" rx="24" fill="var(--robot-body)" stroke="var(--robot-dark)" strokeWidth="5" />
      <rect x="78" y="158" width="44" height="26" rx="10" fill="var(--robot-accent)" />
      <circle cx="90" cy="171" r="4" fill="var(--robot-dark)" />
      <circle cx="110" cy="171" r="4" fill="var(--robot-dark)" />

      {/* 머리 */}
      <rect x="28" y="44" width="144" height="104" rx="36" fill="var(--robot-body)" stroke="var(--robot-dark)" strokeWidth="5" />
      <rect x="16" y="82" width="14" height="30" rx="7" fill="var(--robot-accent)" stroke="var(--robot-dark)" strokeWidth="4" />
      <rect x="170" y="82" width="14" height="30" rx="7" fill="var(--robot-accent)" stroke="var(--robot-dark)" strokeWidth="4" />
      <rect x="44" y="60" width="112" height="72" rx="26" fill="var(--robot-screen)" />

      {/* 눈 */}
      {mood === 'happy' || mood === 'cheer' ? (
        <>
          <path d="M66 96 q12 -16 24 0" stroke="var(--robot-eye)" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M110 96 q12 -16 24 0" stroke="var(--robot-eye)" strokeWidth="7" fill="none" strokeLinecap="round" />
        </>
      ) : mood === 'oops' ? (
        <>
          <path d="M68 84 l18 14 M86 84 l-18 14" stroke="var(--robot-eye)" strokeWidth="6" strokeLinecap="round" />
          <path d="M114 84 l18 14 M132 84 l-18 14" stroke="var(--robot-eye)" strokeWidth="6" strokeLinecap="round" />
        </>
      ) : (
        <g className={styles.eyes}>
          <ellipse cx="78" cy="92" rx="10" ry={mood === 'think' ? 7 : 12} fill="var(--robot-eye)" />
          <ellipse cx="122" cy="92" rx="10" ry={mood === 'think' ? 7 : 12} fill="var(--robot-eye)" />
          <circle cx="81" cy="88" r="3.5" fill="#fff" />
          <circle cx="125" cy="88" r="3.5" fill="#fff" />
        </g>
      )}

      {/* 볼 */}
      <circle cx="58" cy="114" r="7" fill="var(--robot-cheek)" opacity="0.8" />
      <circle cx="142" cy="114" r="7" fill="var(--robot-cheek)" opacity="0.8" />

      {/* 입 */}
      {mood === 'think' ? (
        <path d="M88 116 h24" stroke="var(--robot-eye)" strokeWidth="6" strokeLinecap="round" />
      ) : mood === 'oops' ? (
        <ellipse cx="100" cy="118" rx="7" ry="6" fill="var(--robot-eye)" />
      ) : (
        <path d={mood === 'idle' ? 'M86 112 q14 12 28 0' : 'M82 108 q18 22 36 0 z'} stroke="var(--robot-eye)" strokeWidth="6"
          fill={mood === 'idle' ? 'none' : 'var(--robot-eye)'} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
