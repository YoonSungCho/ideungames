import { useMemo } from 'react';
import styles from './Confetti.module.css';

const COLORS = ['#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0', '#7c6cf2', '#ff8fab'];

/** 화면 전체에 떨어지는 축하 색종이. 표시되는 동안만 렌더한다. */
export function Confetti({ count = 80 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.2 + Math.random() * 1.8,
        rotate: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.6,
        size: 8 + Math.random() * 8,
      })),
    [count],
  );
  return (
    <div className={styles.layer} aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={styles.piece}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--r' as string]: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
