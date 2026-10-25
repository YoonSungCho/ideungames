import type { Dir } from '../engine/world';
import styles from './Trainer.module.css';

const INK = '#2b2350';
const SKIN = '#ffd9b8';
const HAIR = '#4a2e22';
const CAP = '#ef476f';
const JACKET = '#3f9cf5';
const PANTS = '#334a7d';
const BAG = '#ffc23d';

/**
 * 주인공 트레이너 (모자에 ㄱ 마크). 방향마다 앞·뒤·옆 모습, 걸을 때 팔다리가 번갈아 움직인다.
 */
export function Trainer({ dir, walking }: { dir: Dir; walking: boolean }) {
  const back = dir === 'up';
  const side = dir === 'left' || dir === 'right';
  return (
    <svg viewBox="0 0 48 60" className={[styles.trainer, walking && styles.walking, dir === 'left' && styles.flip].filter(Boolean).join(' ')} aria-hidden>
      <ellipse cx="24" cy="57" rx="13" ry="3" fill="#000" opacity="0.18" />
      {/* 다리 */}
      <g className={styles.legA}>
        <rect x={side ? 19 : 15} y="40" width="7" height="12" rx="3" fill={PANTS} stroke={INK} strokeWidth="1.6" />
        <ellipse cx={side ? 24 : 18.5} cy="53" rx="5" ry="3" fill="#fff" stroke={INK} strokeWidth="1.6" />
      </g>
      <g className={styles.legB}>
        <rect x={side ? 22 : 26} y="40" width="7" height="12" rx="3" fill={PANTS} stroke={INK} strokeWidth="1.6" />
        <ellipse cx={side ? 27 : 29.5} cy="53" rx="5" ry="3" fill="#fff" stroke={INK} strokeWidth="1.6" />
      </g>
      {/* 가방 (뒤·옆) */}
      {back && <rect x="12" y="27" width="24" height="16" rx="5" fill={BAG} stroke={INK} strokeWidth="1.8" />}
      {side && <rect x="9" y="28" width="9" height="13" rx="3.5" fill={BAG} stroke={INK} strokeWidth="1.6" />}
      {/* 팔 */}
      <g className={styles.armA}>
        <rect x={side ? 20 : 9} y="28" width="6" height="12" rx="3" fill={JACKET} stroke={INK} strokeWidth="1.6" />
        <circle cx={side ? 23 : 12} cy="40" r="2.8" fill={SKIN} stroke={INK} strokeWidth="1.4" />
      </g>
      {!side && (
        <g className={styles.armB}>
          <rect x="33" y="28" width="6" height="12" rx="3" fill={JACKET} stroke={INK} strokeWidth="1.6" />
          <circle cx="36" cy="40" r="2.8" fill={SKIN} stroke={INK} strokeWidth="1.4" />
        </g>
      )}
      {/* 몸 */}
      <path d="M14 30 Q14 26 18 26 L30 26 Q34 26 34 30 L34 41 Q34 44 31 44 L17 44 Q14 44 14 41 Z" fill={JACKET} stroke={INK} strokeWidth="1.8" />
      {!back && !side && (
        <>
          <path d="M24 27 L24 43" stroke="#fff" strokeWidth="1.6" />
          <path d="M17 27 L19 36 M31 27 L29 36" stroke={BAG} strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}
      {side && <path d="M16 30 L32 30" stroke="#fff" strokeWidth="1.4" opacity="0.6" />}
      {/* 머리 */}
      <circle cx="24" cy="17" r="12.5" fill={SKIN} stroke={INK} strokeWidth="1.8" />
      {back ? (
        <path d="M11.5 17 Q11 29 24 29.5 Q37 29 36.5 17 Z" fill={HAIR} stroke={INK} strokeWidth="1.6" />
      ) : side ? (
        <>
          <path d="M12 16 Q12 24 17 27 L18 16 Z" fill={HAIR} />
          <ellipse cx="30" cy="18" rx="1.8" ry="2.4" fill={INK} />
          <circle cx="30.6" cy="17.2" r="0.7" fill="#fff" />
          <ellipse cx="31" cy="22.5" rx="2.6" ry="1.4" fill="#ff9fb2" opacity="0.6" />
          <path d="M33 22 Q34.5 23 33.5 24.5" stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M12 15 Q16 21 20 16 Q24 21 28 16 Q32 21 36 15" fill={HAIR} />
          <ellipse cx="19" cy="19" rx="1.9" ry="2.5" fill={INK} />
          <ellipse cx="29" cy="19" rx="1.9" ry="2.5" fill={INK} />
          <circle cx="19.6" cy="18.2" r="0.7" fill="#fff" />
          <circle cx="29.6" cy="18.2" r="0.7" fill="#fff" />
          <ellipse cx="16" cy="23" rx="2.4" ry="1.4" fill="#ff9fb2" opacity="0.6" />
          <ellipse cx="32" cy="23" rx="2.4" ry="1.4" fill="#ff9fb2" opacity="0.6" />
          <path d="M21.5 24 Q24 26.5 26.5 24" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* 모자 */}
      <path d="M10.5 14 Q10.5 3.5 24 3.5 Q37.5 3.5 37.5 14 Z" fill={CAP} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      {!back && <path d={side ? 'M28 13.5 L41 14 Q42 16.5 39 16.8 L28 16 Z' : 'M12 13.5 L36 13.5 Q37 16.5 34 16.8 L14 16.8 Q11 16.5 12 13.5 Z'} fill="#c9184a" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />}
      {!back && !side && (
        <>
          <path d="M19 5.5 Q24 4 29 5.5 L29 12 L19 12 Z" fill="#fff" />
          <text x="24" y="11.5" textAnchor="middle" fontSize="7" fontFamily="Jua, sans-serif" fill={CAP}>ㄱ</text>
        </>
      )}
      {back && <circle cx="24" cy="12" r="2" fill="#fff" />}
    </svg>
  );
}
