import { useLayoutEffect, useRef, useState } from 'react';
import type { View } from '../engine/types';
import { Tori, type ToriMood } from './Tori';
import styles from './Bunny.module.css';

const COUNT = 11;
const at = (n: number, view: View) => `${((n - view.lo + 0.5) / COUNT) * 100}%`;
/** 한 칸 뛰는 데 걸리는 시간 (화면 효과와 같이) */
export const HOP_MS = 380;

interface StonesProps {
  view: View;
  /** 토리가 지나온 돌 (마지막이 지금 자리) */
  path: number[];
  onStone?: (n: number) => void;
  /** 도착해야 할 곳 (🚩) */
  flag?: number;
  /** 수 비교: 두 수에 표시 */
  marks?: { n: number; label: string }[];
  /** 정답 공개: 반짝이는 돌 */
  glow?: number;
  /** 도착 맞히기 힌트: 출발점에서 k칸 점선 (도착 돌은 표시하지 않음) */
  guide?: { from: number; k: number; dir: 1 | -1 };
  mood?: ToriMood;
  /** 여러 칸을 한 번에 받으면 한 칸씩 뛰어 보여 주고, 뛸 때마다 알린다 */
  onHopShown?: (hops: number) => void;
  hidden?: boolean;
}

/** 징검다리 수 길: 11개 돌, 토리가 한 칸씩 뛰고 지나온 칸마다 1, 2, 3… 번호가 붙은 무지개 다리 */
export function Stones({ view, path, onStone, flag, marks, glow, guide, mood = 'idle', onHopShown, hidden }: StonesProps) {
  const [shown, setShown] = useState(path.length);
  const prev = useRef(path);
  const hopRef = useRef(onHopShown);
  hopRef.current = onHopShown;

  // 한 번에 여러 칸이 늘면(도착 맞히기 정답) 한 칸씩 뛰어 보여 준다
  useLayoutEffect(() => {
    const old = prev.current;
    prev.current = path;
    const extends_ = path.length > old.length && old.every((v, i) => path[i] === v);
    if (!extends_ || path.length - old.length === 1) {
      setShown(path.length);
      return;
    }
    let n = old.length;
    setShown(n);
    const id = setInterval(() => {
      n++;
      setShown(n);
      hopRef.current?.(n - 1);
      if (n >= path.length) clearInterval(id);
    }, HOP_MS);
    return () => clearInterval(id);
  }, [path]);

  const visible = path.slice(0, Math.max(1, Math.min(shown, path.length)));
  const pos = visible[visible.length - 1];
  const stones = Array.from({ length: COUNT }, (_, i) => view.lo + i);
  const guideStops = guide ? Array.from({ length: guide.k }, (_, i) => guide.from + guide.dir * (i + 1)) : [];

  return (
    <div className={[styles.line, hidden && styles.lineHidden].filter(Boolean).join(' ')} role="group" aria-label="수 길">
      <div className={styles.arcs} aria-hidden>
        {guide &&
          guideStops.map((to, i) => {
            const from = i === 0 ? guide.from : guideStops[i - 1];
            return <Arc key={`g${i}`} from={from} to={to} view={view} label={i + 1} dashed />;
          })}
        {visible.slice(1).map((to, i) => (
          <Arc key={`${i}-${visible[i]}-${to}`} from={visible[i]} to={to} view={view} label={i + 1} />
        ))}
        {flag !== undefined && flag >= view.lo && flag <= view.hi && (
          <span className={styles.flag} style={{ left: at(flag, view) }}>
            🚩
          </span>
        )}
        {marks?.map((m) => (
          <span key={m.n} className={styles.mark} style={{ left: at(m.n, view) }}>
            {m.label}
          </span>
        ))}
      </div>
      {pos !== undefined && (
        <div className={styles.toriAt} style={{ left: at(pos, view) }} data-pos={pos} aria-label={`토리는 ${pos}에 있어요`}>
          <div className={styles.toriHop} key={visible.length}>
            <Tori mood={mood} size="100%" />
          </div>
        </div>
      )}
      <div className={styles.stones}>
        {stones.map((n) => {
          const cls = [styles.stone, n === glow && styles.glow, n === path[0] && path.length > 0 && styles.startStone, n % 5 === 0 && styles.fiveStone].filter(Boolean).join(' ');
          return onStone ? (
            <button key={n} className={cls} onPointerDown={(e) => (e.preventDefault(), onStone(n))} onClick={(e) => e.detail === 0 && onStone(n)} aria-label={`돌 ${n}`} data-correct={n === glow || undefined}>
              {n}
            </button>
          ) : (
            <span key={n} className={cls}>
              {n}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Arc({ from, to, view, label, dashed }: { from: number; to: number; view: View; label: number; dashed?: boolean }) {
  const lo = Math.min(from, to);
  return (
    <span className={[styles.arc, dashed && styles.arcGuide, to < from && styles.arcBack].filter(Boolean).join(' ')} style={{ left: at(lo, view) }}>
      <b>{label}</b>
    </span>
  );
}
