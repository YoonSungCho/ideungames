import { useCallback, useLayoutEffect, useRef } from 'react';
import { OP_SYMBOL, type Problem } from '../engine';
import { currentProblem, REVEAL_AFTER, useQuickMath } from '../store';
import styles from './QuickMath.module.css';

const stageKeyOf = (p: Problem) => `${p.a}${p.op}${p.b}${p.blank}`;

/**
 * 식이 게임판 폭의 92%·높이의 34%를 넘지 않는 가장 큰 글자 크기로 맞춘다.
 * 모든 크기가 em 단위라 폭은 글자 크기에 비례 → 한 번 재서 비율로 맞추면 된다.
 */
function useFitText(dep: string) {
  const el = useRef<HTMLElement | null>(null);
  const apply = useCallback(() => {
    const node = el.current;
    const box = node?.closest<HTMLElement>('[data-stage]');
    if (!node || !box) return;
    const fs = parseFloat(getComputedStyle(node).fontSize);
    const w = node.offsetWidth;
    if (!fs || !w) return;
    const next = Math.min((fs * box.clientWidth * 0.92) / w, box.clientHeight * 0.34, 128);
    node.style.fontSize = `${Math.max(24, Math.floor(next))}px`;
  }, []);
  useLayoutEffect(() => {
    apply();
    const box = el.current?.closest<HTMLElement>('[data-stage]');
    if (!box) return;
    const ro = new ResizeObserver(apply);
    ro.observe(box);
    return () => ro.disconnect();
  }, [apply, dep]);
  // 정답/오답 애니메이션으로 요소가 새로 그려질 때도 다시 맞춘다
  return useCallback(
    (node: HTMLElement | null) => {
      el.current = node;
      if (node) apply();
    },
    [apply],
  );
}

/** 문제 판: "7 + 8 = [15]" — 빈칸(□)은 답 자리 또는 앞/뒤 수 */
export function Stage() {
  const session = useQuickMath((s) => s.session)!;
  const event = useQuickMath((s) => s.event);
  const p = currentProblem(session) ?? session.problems[session.problems.length - 1];
  const input = session.input;
  const revealed = session.tries >= REVEAL_AFTER;
  const fx = event && (event.kind === 'wrong' || event.kind === 'reveal') ? 'shake' : event?.kind === 'correct' ? 'pop' : null;

  const box = (
    <span className={[styles.answer, input && styles.answerTyped].filter(Boolean).join(' ')} aria-label={`답 ${input || '입력 전'}`}>
      {input || ' '}
      <span className={styles.caret} aria-hidden />
    </span>
  );
  const num = (n: number) => <span className={styles.num}>{n}</span>;
  const fit = useFitText(stageKeyOf(p));
  return (
    <div className={styles.stageInner}>
      <div
        className={[styles.problem, fx && styles[fx]].filter(Boolean).join(' ')}
        ref={fit}
        key={event?.key ?? 'p'}
        role="status"
        aria-live="polite"
      >
        {p.blank === 'a' ? box : num(p.a)}
        <span className={[styles.opSign, styles[`op_${p.op}`]].join(' ')}>{OP_SYMBOL[p.op]}</span>
        {p.blank === 'b' ? box : num(p.b)}
        <span className={styles.eq}>=</span>
        {p.blank === 'result' ? box : num(p.result)}
      </div>
      <p className={styles.reveal} aria-live="polite">
        {revealed ? (
          <>정답은 <b>{p.answer}</b>! 직접 눌러 볼까?</>
        ) : session.tries > 0 ? (
          '아까워! 다시 해 보자'
        ) : (
          ' '
        )}
      </p>
    </div>
  );
}
