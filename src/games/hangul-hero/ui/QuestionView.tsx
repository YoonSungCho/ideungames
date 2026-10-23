import { useEffect } from 'react';
import { speak, useCanSpeakKorean } from '@/shared/sound/speak';
import { compose } from '../engine/hangul';
import type { Question } from '../engine/types';
import { currentQuestion, useHangulHero } from '../store';
import styles from './HangulHero.module.css';

/** 문제 판: 안내 + 그림/글자 + 🔊 */
export function PromptCard({ q, live, revealed }: { q: Question; live: boolean; revealed?: string }) {
  const say = q.prompt.say;
  const voice = useCanSpeakKorean();
  // 새 문제가 나오면 자동으로 읽어 준다
  useEffect(() => {
    if (live && say) speak(say);
  }, [q.id, live, say]);

  return (
    <div className={styles.promptCard} key={q.id}>
      <p className={styles.ask}>{q.prompt.ask}</p>
      {q.prompt.listenOnly && voice ? (
        <button className={styles.bigSpeaker} onClick={() => say && speak(say)} aria-label="다시 듣기">
          🔊
          <small>다시 듣기</small>
        </button>
      ) : q.prompt.listenOnly ? (
        // 소리를 낼 수 없으면 읽을 말을 글자로
        <span className={styles.promptBig} aria-label={`문제 ${say}`}>{say}</span>
      ) : (
        <div className={styles.promptBody}>
          {q.prompt.emoji && <span className={styles.promptEmoji} aria-hidden>{q.prompt.emoji}</span>}
          {q.prompt.big && <span className={[styles.promptBig, q.prompt.big.length > 6 && styles.promptSentence].filter(Boolean).join(' ')}>{q.prompt.big}</span>}
          {say && !q.prompt.big && !voice && <span className={styles.promptWord}>{say}</span>}
          {say && voice && (
            <button className={styles.speakBtn} onClick={() => speak(say)} aria-label="소리 듣기">
              🔊
            </button>
          )}
        </div>
      )}
      {revealed && (
        <p className={styles.revealMsg} role="status">
          정답은 <b>{revealed}</b>! 초록색을 눌러 볼까?
        </p>
      )}
    </div>
  );
}

/** 답하는 곳: 보기 고르기 / 글자 짓기 / 문장 순서 */
export function AnswerArea() {
  const session = useHangulHero((s) => s.session)!;
  const event = useHangulHero((s) => s.event);
  const { choose, pickBuild, tapTile, undoTile } = useHangulHero.getState();
  const q = currentQuestion(session);
  const revealed = session.tries >= 2;
  const flash = (value: string) => (event?.value === value ? event.kind : null);

  if (q.kind === 'choice') {
    return (
      <div className={[styles.options, styles[`opts${q.options.length}`], q.optionSize === 'word' && styles.wordOptions].filter(Boolean).join(' ')} role="group" aria-label="보기">
        {q.options.map((o) => {
          const f = flash(o);
          const isAnswer = o === q.answer;
          return (
            <button
              key={`${q.id}${o}`}
              className={[
                styles.option,
                (f === 'correct' || f === 'hit') && styles.optCorrect,
                (f === 'wrong' || f === 'reveal') && styles.optWrong,
                revealed && isAnswer && !session.solved && styles.optReveal,
                revealed && !isAnswer && styles.optDim,
              ].filter(Boolean).join(' ')}
              onClick={() => {
                if (q.optionSay?.[o]) speak(q.optionSay[o]);
                choose(o);
              }}
              aria-label={o}
            >
              {o}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.kind === 'build') {
    const { cho, jung } = session.build;
    const preview = cho && jung ? compose(cho, jung) : session.solved ? q.result : `${cho ?? '?'} ${jung ?? '?'}`;
    const showAnswer = revealed && !session.solved;
    return (
      <div className={styles.buildArea}>
        <div className={[styles.buildPreview, session.solved && styles.optCorrect, event?.kind === 'wrong' || event?.kind === 'reveal' ? styles.shakeOnce : ''].filter(Boolean).join(' ')} key={event?.key} aria-live="polite">
          {preview}
          {showAnswer && <small>정답: {q.answer.cho} + {q.answer.jung} = {q.result}</small>}
        </div>
        <div className={styles.buildRow} role="group" aria-label="자음 블록">
          <span className={styles.buildLabel}>자음</span>
          {q.cho.map((c) => (
            <button key={c} className={[styles.block, styles.blockC, cho === c && styles.blockOn, showAnswer && c === q.answer.cho && styles.optReveal].filter(Boolean).join(' ')} onClick={() => pickBuild('cho', c)} aria-label={`자음 ${c}`}>
              {c}
            </button>
          ))}
        </div>
        <div className={styles.buildRow} role="group" aria-label="모음 블록">
          <span className={styles.buildLabel}>모음</span>
          {q.jung.map((v) => (
            <button key={v} className={[styles.block, styles.blockV, jung === v && styles.blockOn, showAnswer && v === q.answer.jung && styles.optReveal].filter(Boolean).join(' ')} onClick={() => pickBuild('jung', v)} aria-label={`모음 ${v}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 문장 순서
  const made = session.order.map((i) => q.tiles[i]);
  return (
    <div className={styles.orderArea}>
      <div className={[styles.sentenceLine, session.solved && styles.optCorrect].filter(Boolean).join(' ')} key={event?.key} aria-live="polite">
        {q.answer.map((_, k) => (
          <span key={k} className={styles.slot}>{session.solved ? q.answer[k] : made[k] ?? ''}</span>
        ))}
      </div>
      {revealed && !session.solved && <p className={styles.orderHint}>정답: {q.answer.join(' ')}</p>}
      <div className={styles.tiles} role="group" aria-label="낱말 조각">
        {q.tiles.map((t, i) => (
          <button key={`${q.id}${i}`} className={[styles.tile, session.order.includes(i) && styles.tileUsed].filter(Boolean).join(' ')} onClick={() => tapTile(i)} disabled={session.order.includes(i)} aria-label={t}>
            {t}
          </button>
        ))}
        <button className={[styles.tile, styles.tileUndo].join(' ')} onClick={undoTile} disabled={!session.order.length} aria-label="하나 빼기">
          ↩
        </button>
      </div>
    </div>
  );
}
