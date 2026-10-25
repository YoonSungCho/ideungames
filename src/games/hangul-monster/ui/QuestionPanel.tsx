import { useEffect, useMemo, useRef, useState } from 'react';
import { josa } from '@/shared/korean';
import { playSound } from '@/shared/sound/sfx';
import { speak, useCanSpeakKorean } from '@/shared/sound/speak';
import { compose } from '../../hangul-hero/engine/hangul';
import type { Question } from '../../hangul-hero/engine/types';
import { FAST_MS } from '../store';
import styles from './HangulMonster.module.css';

/**
 * 기술을 쓰려면 푸는 문제. 빨리(5초 안) 맞히면 급소!
 * 보기 고르기 · 글자 짓기(자음+모음 블록) · 문장 순서(낱말 조각) 세 가지 모양.
 * 틀리면 정답을 잠깐 보여 주고 넘어간다 (빗나감).
 */
export function QuestionPanel({ q, moveName, onDone }: { q: Question; moveName: string; onDone: (correct: boolean, elapsedMs: number) => void }) {
  const voice = useCanSpeakKorean();
  const started = useRef(performance.now());
  const [result, setResult] = useState<'right' | 'wrong' | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [cho, setCho] = useState<string | null>(null);
  const [jung, setJung] = useState<string | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const say = q.prompt.say;
  const count = !!q.prompt.emoji && [...q.prompt.emoji].length > 3;

  useEffect(() => {
    started.current = performance.now();
    if (say) speak(say);
  }, [q.id, say]);

  const finish = (ok: boolean) => {
    const elapsed = performance.now() - started.current;
    setResult(ok ? 'right' : 'wrong');
    playSound(ok ? 'place' : 'wrong');
    setTimeout(() => onDone(ok, elapsed), ok ? 450 : 1700);
  };

  // 문장 순서: 조각마다 정답에서 몇 번째인지 (정답 공개·테스트용)
  const seq = useMemo(() => {
    if (q.kind !== 'order') return [];
    const used = new Set<number>();
    const out: number[] = Array(q.tiles.length).fill(-1);
    q.answer.forEach((w, k) => {
      const i = q.tiles.findIndex((t, j) => t === w && !used.has(j));
      used.add(i);
      out[i] = k;
    });
    return out;
  }, [q]);

  const revealText = q.kind === 'choice' ? q.answer : q.kind === 'build' ? `${q.answer.cho} + ${q.answer.jung} = ${q.result}` : q.answer.join(' ');

  return (
    <div className={styles.question} key={q.id}>
      <p className={styles.qMove}>
        ⚡ <b>{josa(moveName, '을/를')}</b> 쓰려면…
      </p>
      <div className={styles.qPrompt}>
        <p className={styles.qAsk}>{q.prompt.ask}</p>
        <div className={styles.qBody}>
          {q.prompt.listenOnly && voice ? (
            <button className={styles.qSpeaker} onClick={() => say && speak(say)} aria-label="다시 듣기">🔊</button>
          ) : q.prompt.listenOnly ? (
            <span className={styles.qBig} aria-label={`문제 ${say}`}>{say}</span>
          ) : (
            <>
              {q.prompt.emoji && <span className={[styles.qEmoji, count && styles.qCount].filter(Boolean).join(' ')} aria-hidden>{q.prompt.emoji}</span>}
              {q.prompt.big && <span className={[styles.qBig, q.prompt.big.length > 5 && styles.qLong].filter(Boolean).join(' ')}>{q.prompt.big}</span>}
              {say && !q.prompt.big && !voice && <span className={styles.qBig}>{say}</span>}
              {say && voice && (
                <button className={styles.qSpeakSmall} onClick={() => speak(say)} aria-label="소리 듣기">🔊</button>
              )}
            </>
          )}
        </div>
        <div className={[styles.fastBar, result && styles.fastStop].filter(Boolean).join(' ')} style={{ animationDuration: `${FAST_MS}ms` }} aria-hidden />
      </div>

      {q.kind === 'choice' && (
        <div className={[styles.qOptions, q.optionSize === 'word' && styles.qWords, styles[`qo${q.options.length}`]].filter(Boolean).join(' ')} role="group" aria-label="보기">
          {q.options.map((o) => (
            <button
              key={o}
              className={[styles.qOption, result && o === q.answer && styles.qRight, picked === o && o !== q.answer && styles.qWrong].filter(Boolean).join(' ')}
              onClick={() => {
                if (result) return;
                setPicked(o);
                finish(o === q.answer);
              }}
              disabled={!!result}
              aria-label={o}
              data-correct={o === q.answer || undefined}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {q.kind === 'build' && (
        <div className={styles.build}>
          <div className={[styles.buildPreview, result === 'right' && styles.qRight, result === 'wrong' && styles.qWrong].filter(Boolean).join(' ')} aria-live="polite">
            {cho && jung ? compose(cho, jung) : `${cho ?? '?'} + ${jung ?? '?'}`}
          </div>
          {(['cho', 'jung'] as const).map((part) => (
            <div key={part} className={styles.buildRow} role="group" aria-label={part === 'cho' ? '자음 블록' : '모음 블록'}>
              {(part === 'cho' ? q.cho : q.jung).map((j) => {
                const on = (part === 'cho' ? cho : jung) === j;
                const right = j === q.answer[part];
                return (
                  <button
                    key={j}
                    className={[styles.block, part === 'cho' ? styles.blockC : styles.blockV, on && styles.blockOn, result === 'wrong' && right && styles.qRight].filter(Boolean).join(' ')}
                    disabled={!!result}
                    aria-label={`${part === 'cho' ? '자음' : '모음'} ${j}`}
                    data-correct={right || undefined}
                    onClick={() => {
                      const c = part === 'cho' ? j : cho;
                      const v = part === 'jung' ? j : jung;
                      if (part === 'cho') setCho(j);
                      else setJung(j);
                      playSound('tap');
                      if (c && v) finish(c === q.answer.cho && v === q.answer.jung);
                    }}
                  >
                    {j}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {q.kind === 'order' && (
        <div className={styles.order}>
          <div className={[styles.sentence, result === 'right' && styles.qRight, result === 'wrong' && styles.qWrong].filter(Boolean).join(' ')} aria-live="polite">
            {q.answer.map((_, k) => (
              <span key={k} className={styles.slot}>{order[k] !== undefined ? q.tiles[order[k]] : ''}</span>
            ))}
          </div>
          <div className={styles.wordTiles} role="group" aria-label="낱말 조각">
            {q.tiles.map((t, i) => (
              <button
                key={`${q.id}${i}`}
                className={[styles.wordTile, order.includes(i) && styles.wordTileUsed].filter(Boolean).join(' ')}
                disabled={!!result || order.includes(i)}
                aria-label={t}
                data-seq={seq[i]}
                onClick={() => {
                  const next = [...order, i];
                  setOrder(next);
                  playSound('tap');
                  if (next.length === q.answer.length) finish(next.map((k) => q.tiles[k]).join(' ') === q.answer.join(' '));
                }}
              >
                {t}
              </button>
            ))}
            <button className={[styles.wordTile, styles.wordTileUndo].join(' ')} onClick={() => setOrder(order.slice(0, -1))} disabled={!!result || !order.length} aria-label="하나 빼기">
              ↩
            </button>
          </div>
        </div>
      )}

      {result === 'wrong' && (
        <p className={styles.qReveal} role="status">
          정답은 <b>{revealText}</b>! 다음엔 맞힐 수 있어!
        </p>
      )}
    </div>
  );
}
