import { useEffect, useRef, useState } from 'react';
import { josa } from '@/shared/korean';
import { playSound } from '@/shared/sound/sfx';
import { speak, useCanSpeakKorean } from '@/shared/sound/speak';
import type { ChoiceQuestion } from '../../hangul-hero/engine/types';
import { FAST_MS } from '../store';
import styles from './HangulMonster.module.css';

/**
 * 기술을 쓰려면 푸는 문제. 빨리(5초 안) 맞히면 급소!
 * 틀리면 정답을 초록색으로 잠깐 보여 주고 넘어간다 (빗나감).
 */
export function QuestionPanel({ q, moveName, onDone }: { q: ChoiceQuestion; moveName: string; onDone: (correct: boolean, elapsedMs: number) => void }) {
  const voice = useCanSpeakKorean();
  const started = useRef(performance.now());
  const [picked, setPicked] = useState<string | null>(null);
  const say = q.prompt.say;

  useEffect(() => {
    started.current = performance.now();
    if (say) speak(say);
  }, [q.id, say]);

  const choose = (o: string) => {
    if (picked) return;
    const elapsed = performance.now() - started.current;
    setPicked(o);
    const ok = o === q.answer;
    playSound(ok ? 'place' : 'wrong');
    setTimeout(() => onDone(ok, elapsed), ok ? 450 : 1500);
  };

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
              {q.prompt.emoji && <span className={styles.qEmoji} aria-hidden>{q.prompt.emoji}</span>}
              {q.prompt.big && <span className={[styles.qBig, q.prompt.big.length > 5 && styles.qLong].filter(Boolean).join(' ')}>{q.prompt.big}</span>}
              {say && !q.prompt.big && !voice && <span className={styles.qBig}>{say}</span>}
              {say && voice && (
                <button className={styles.qSpeakSmall} onClick={() => speak(say)} aria-label="소리 듣기">🔊</button>
              )}
            </>
          )}
        </div>
        <div className={[styles.fastBar, picked && styles.fastStop].filter(Boolean).join(' ')} style={{ animationDuration: `${FAST_MS}ms` }} aria-hidden />
      </div>
      <div className={[styles.qOptions, q.optionSize === 'word' && styles.qWords, styles[`qo${q.options.length}`]].filter(Boolean).join(' ')} role="group" aria-label="보기">
        {q.options.map((o) => (
          <button
            key={o}
            className={[
              styles.qOption,
              picked && o === q.answer && styles.qRight,
              picked === o && o !== q.answer && styles.qWrong,
            ].filter(Boolean).join(' ')}
            onClick={() => choose(o)}
            disabled={!!picked}
            aria-label={o}
            data-correct={o === q.answer || undefined}
          >
            {o}
          </button>
        ))}
      </div>
      {picked && picked !== q.answer && <p className={styles.qReveal} role="status">정답은 <b>{q.answer}</b>! 다음엔 맞힐 수 있어!</p>}
    </div>
  );
}
