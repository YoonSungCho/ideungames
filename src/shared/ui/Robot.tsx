import { useId } from 'react';
import styles from './Robot.module.css';

export type RobotMood = 'idle' | 'happy' | 'cheer' | 'think' | 'oops';

interface RobotProps {
  mood?: RobotMood;
  size?: number;
  className?: string;
}

const EYE = '#67e8f9';

function Eyes({ mood }: { mood: RobotMood }) {
  switch (mood) {
    case 'happy':
    case 'cheer':
      return (
        <g fill="none" stroke={EYE} strokeWidth="7" strokeLinecap="round">
          <path d="M64 93 Q75 76 86 93" />
          <path d="M114 93 Q125 76 136 93" />
        </g>
      );
    case 'oops':
      return (
        <g fill="none" stroke={EYE} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M67 77 L83 88 L67 99" />
          <path d="M133 77 L117 88 L133 99" />
        </g>
      );
    case 'think':
      return (
        <g fill={EYE}>
          <rect x="70" y="72" width="17" height="20" rx="8.5" />
          <rect x="120" y="72" width="17" height="20" rx="8.5" />
          <path d="M66 68 L88 64" stroke={EYE} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    default:
      return (
        <g className={styles.blink} fill={EYE}>
          <rect x="66" y="74" width="18" height="26" rx="9" />
          <rect x="116" y="74" width="18" height="26" rx="9" />
          <circle cx="79" cy="81" r="3" fill="#fff" opacity="0.9" />
          <circle cx="129" cy="81" r="3" fill="#fff" opacity="0.9" />
        </g>
      );
  }
}

function Mouth({ mood }: { mood: RobotMood }) {
  const common = { stroke: EYE, strokeLinecap: 'round' as const, fill: 'none' };
  switch (mood) {
    case 'cheer':
      return <path d="M86 104 Q100 124 114 104 Z" fill={EYE} stroke={EYE} strokeWidth="3" strokeLinejoin="round" />;
    case 'happy':
      return <path d="M87 106 Q100 118 113 106" strokeWidth="5" {...common} />;
    case 'think':
      return <path d="M93 111 L109 108" strokeWidth="4" {...common} />;
    case 'oops':
      return <ellipse cx="100" cy="110" rx="6" ry="5" strokeWidth="4" {...common} />;
    default:
      return <path d="M91 108 Q100 114 109 108" strokeWidth="4" {...common} />;
  }
}

/**
 * 이든 게임즈 마스코트 '띠봇'.
 * 매끈한 흰 몸체 + 어두운 유리 바이저 + 빛나는 LED 표정. 공중에 떠 있는 로봇.
 */
export function Robot({ mood = 'idle', size = 120, className }: RobotProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
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
      <defs>
        <radialGradient id={id('shell')} cx="35%" cy="25%" r="85%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#f1eefc" />
          <stop offset="1" stopColor="#d4cdf0" />
        </radialGradient>
        <linearGradient id={id('visor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#332e66" />
          <stop offset="1" stopColor="#161331" />
        </linearGradient>
        <linearGradient id={id('accent')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a594ff" />
          <stop offset="1" stopColor="#5b4bd8" />
        </linearGradient>
        <filter id={id('glow')} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 바닥 그림자 (몸이 뜰 때 작아짐) */}
      <ellipse className={styles.shadow} cx="100" cy="213" rx="38" ry="5" fill="#2f2a55" opacity="0.13" />

      <g className={styles.float}>
        {/* 팔 */}
        <g className={styles.armL}>
          <ellipse cx="50" cy="174" rx="11" ry="21" fill={url('shell')} stroke="#c9c2ea" strokeWidth="1.5"
            transform={armsUp ? 'rotate(108 58 160)' : 'rotate(22 58 160)'} />
        </g>
        <g className={styles.armR}>
          <ellipse cx="150" cy="174" rx="11" ry="21" fill={url('shell')} stroke="#c9c2ea" strokeWidth="1.5"
            transform={armsUp ? 'rotate(-108 142 160)' : 'rotate(-22 142 160)'} />
        </g>

        {/* 몸통 */}
        <path d="M100 140 C138 140 151 162 147 184 C143 203 124 209 100 209 C76 209 57 203 53 184 C49 162 62 140 100 140 Z"
          fill={url('shell')} stroke="#c9c2ea" strokeWidth="1.5" />
        <rect x="80" y="163" width="40" height="20" rx="10" fill={url('visor')} />
        <g filter={url('glow')}>
          <circle className={styles.led} cx="90" cy="173" r="3.2" fill={EYE} />
          <circle className={styles.led} cx="100" cy="173" r="3.2" fill="#a594ff" />
          <circle className={styles.led} cx="110" cy="173" r="3.2" fill="#ffd166" />
        </g>
        <ellipse cx="100" cy="141" rx="24" ry="5" fill="#bdb5e3" />

        {/* 안테나 */}
        <path d="M100 32 V15" stroke="#c9c2ea" strokeWidth="4" strokeLinecap="round" />
        <circle className={styles.antenna} cx="100" cy="11" r="7" fill="#ffd166" filter={url('glow')} />

        {/* 귀 */}
        <circle cx="27" cy="88" r="14" fill={url('accent')} />
        <circle cx="27" cy="88" r="6" fill="#d9d1ff" opacity="0.9" />
        <circle cx="173" cy="88" r="14" fill={url('accent')} />
        <circle cx="173" cy="88" r="6" fill="#d9d1ff" opacity="0.9" />

        {/* 머리 */}
        <rect x="27" y="30" width="146" height="114" rx="54" fill={url('shell')} stroke="#c9c2ea" strokeWidth="1.5" />
        <ellipse cx="68" cy="45" rx="24" ry="7" fill="#fff" opacity="0.9" transform="rotate(-14 68 45)" />

        {/* 유리 바이저 */}
        <rect x="42" y="52" width="116" height="76" rx="36" fill={url('visor')} />
        <path d="M60 66 Q72 58 94 58" stroke="#fff" strokeOpacity="0.2" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* 볼 */}
        <ellipse cx="58" cy="106" rx="8" ry="4.5" fill="#ff8fab" opacity="0.55" />
        <ellipse cx="142" cy="106" rx="8" ry="4.5" fill="#ff8fab" opacity="0.55" />

        {/* 표정 (LED) */}
        <g filter={url('glow')}>
          <Eyes mood={mood} />
          <Mouth mood={mood} />
        </g>

        {mood === 'cheer' && (
          <g className={styles.sparkles} fill="#ffd166">
            <path d="M178 34 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
            <path d="M20 40 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" />
          </g>
        )}
      </g>
    </svg>
  );
}
