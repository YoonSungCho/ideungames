import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { theme } from '../engine/deck';
import { useSettings } from '@/shared/settings/store';
import { cardTitle, isBattle, MISS_SHOW_MS, peeking, useMemoryCards } from '../store';
import { PLAYER_COLOR, players } from './labels';
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

  // 대결: 틀리면 "○○ 차례!"를 잠깐 크게 알려 준다
  const event = useMemoryCards((s) => s.event);
  const myName = useSettings((s) => s.playerName);
  const battle = isBattle(session);
  const [turnTag, setTurnTag] = useState<number | null>(null);
  useEffect(() => {
    if (!battle || event?.kind !== 'miss') return;
    setTurnTag(event.key);
    const id = setTimeout(() => setTurnTag(null), 1600);
    return () => clearTimeout(id);
  }, [battle, event]);
  const who = battle ? players(session, myName)[session.turn] : null;

  return (
    <div className={styles.boardWrap} ref={ref} style={battle ? ({ '--pc': PLAYER_COLOR[session.turn] } as CSSProperties) : undefined}>
      {peek && <p className={styles.peekTag} role="status">👀 잘 기억해 둬!</p>}
      {!peek && who && turnTag !== null && session.status === 'playing' && (
        <p className={[styles.peekTag, styles.turnTag, session.turn === 1 && styles.upsideDown].filter(Boolean).join(' ')} key={turnTag} role="status">
          {who.icon} {who.name} 차례!
        </p>
      )}
      <div
        // 대결: 열린 카드 그림·글자는 지금 차례인 사람 쪽을 향한다
        className={[styles.board, battle && session.turn === 1 && styles.faceAway].filter(Boolean).join(' ')}
        role="group"
        aria-label="카드"
        style={{ gridTemplateColumns: `repeat(${cols}, ${w}px)`, '--cw': `${w}px`, '--back': t.color, visibility: w ? 'visible' : 'hidden' } as CSSProperties}
      >
        {session.cards.map((c, i) => {
          const matched = session.matched[i];
          const up = !veiled && (peek || matched || session.open.includes(i));
          const missed = missOpen && session.open.includes(i);
          const shown = c.face === 'word' ? `글자 ${c.name}` : c.face === 'expr' ? `식 ${c.sym}` : c.face === 'num' ? `숫자 ${c.name}` : c.name;
          const label = matched ? `${cardTitle(c)} 짝 찾음` : up ? `카드 ${i + 1}: ${shown}` : `카드 ${i + 1}`;
          return (
            <button
              key={i}
              className={[styles.card, up && styles.up, matched && styles.matched, missed && styles.missed].filter(Boolean).join(' ')}
              // 손가락이 닿는 순간 뒤집는다: 누르는 사이 살짝 움직여도 (화면 끌기로 바뀌어) 안 눌리는 일이 없게
              onPointerDown={(e) => {
                if (e.button !== 0 || e.currentTarget.disabled) return;
                e.preventDefault();
                flipCard(i);
              }}
              // 키보드(Enter·Space)로 누를 때
              onClick={(e) => e.detail === 0 && flipCard(i)}
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
                  ) : c.face === 'expr' ? (
                    <>
                      <span className={[styles.word, styles.expr].join(' ')} style={{ '--len': Math.max(3, c.sym.length) } as CSSProperties}>{c.sym.replace('-', '−')}</span>
                      {matched && <span className={styles.name}>= {c.name}</span>}
                    </>
                  ) : (
                    <span className={[styles.word, c.face === 'num' && styles.num].filter(Boolean).join(' ')} style={{ '--len': Math.max(2, c.name.length) } as CSSProperties}>{c.name}</span>
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
