import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { theme } from '../engine/deck';
import { MISS_SHOW_MS, peeking, useMemoryCards } from '../store';
import styles from './Memory.module.css';

const GAP = 8;
/** 카드 모양 (폭 : 높이) */
const ASPECT = 0.78;

/** 판 크기에 맞춰 카드가 가장 커지는 열·행을 고른다 (세로 화면 3×4 ↔ 가로 화면 4×3) */
function useGrid(n: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState({ cols: 0, rows: 0, w: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      let best = { cols: 0, rows: 0, w: 0 };
      for (let cols = 2; cols <= n; cols++) {
        if (n % cols) continue;
        const rows = n / cols;
        const w = Math.min((W - GAP * (cols - 1)) / cols, ((H - GAP * (rows - 1)) / rows) * ASPECT);
        if (w > best.w) best = { cols, rows, w: Math.floor(w) };
      }
      setGrid(best);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [n]);
  return { ref, ...grid };
}

export function Board() {
  const session = useMemoryCards((s) => s.session)!;
  const flipCard = useMemoryCards((s) => s.flipCard);
  const hideMiss = useMemoryCards((s) => s.hideMiss);
  const paused = useMemoryCards((s) => s.paused);
  const { ref, cols, w } = useGrid(session.cards.length);
  const peek = peeking(session);
  const missOpen = session.open.length === 2;
  const t = theme(session.theme);

  // 틀린 두 장은 잠깐 보여 주고 닫는다 (멈추면 그대로 두고, 계속하면 닫힘)
  useEffect(() => {
    if (!missOpen || paused) return;
    const id = setTimeout(hideMiss, MISS_SHOW_MS);
    return () => clearTimeout(id);
  }, [missOpen, paused, hideMiss, session.moves]);

  const veiled = session.status === 'ready' || (session.status === 'playing' && paused);

  return (
    <div className={styles.boardWrap} ref={ref}>
      {peek && <p className={styles.peekTag} role="status">👀 잘 기억해 둬!</p>}
      <div
        className={styles.board}
        role="group"
        aria-label="카드"
        style={{ gridTemplateColumns: `repeat(${cols}, ${w}px)`, '--cw': `${w}px`, '--back': t.color, visibility: w ? 'visible' : 'hidden' } as CSSProperties}
      >
        {session.cards.map((c, i) => {
          const matched = session.matched[i];
          const up = !veiled && (peek || matched || session.open.includes(i));
          const missed = missOpen && session.open.includes(i);
          const label = matched ? `${c.name} 짝 찾음` : up ? `카드 ${i + 1}: ${c.face === 'word' ? `글자 ${c.name}` : c.name}` : `카드 ${i + 1}`;
          return (
            <button
              key={i}
              className={[styles.card, up && styles.up, matched && styles.matched, missed && styles.missed].filter(Boolean).join(' ')}
              onClick={() => flipCard(i)}
              disabled={matched || veiled}
              aria-label={label}
              data-pair={c.pair}
            >
              <span className={styles.inner}>
                <span className={styles.back} aria-hidden>
                  <span className={styles.backMark}>?</span>
                </span>
                <span className={styles.front} aria-hidden>
                  {c.face === 'pic' ? (
                    <>
                      <span className={styles.emoji}>{c.sym}</span>
                      {matched && <span className={styles.name}>{c.name}</span>}
                    </>
                  ) : (
                    <span className={styles.word} style={{ '--len': Math.max(2, c.name.length) } as CSSProperties}>{c.name}</span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
