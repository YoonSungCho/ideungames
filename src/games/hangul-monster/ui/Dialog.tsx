import { useEffect } from 'react';
import { speak, stopSpeaking } from '@/shared/sound/speak';
import { useHangulMonster } from '../store';
import styles from './HangulMonster.module.css';

/** 아래쪽 대화 상자. 누르면 다음 말, 말은 소리로도 읽어 준다 (악당은 낮고 굵은 목소리) */
export function Dialog() {
  const dialog = useHangulMonster((s) => s.dialog);
  const advance = useHangulMonster((s) => s.advance);
  const line = dialog?.lines[dialog.idx];

  useEffect(() => {
    if (!line) return;
    speak(line.text.replace(/[^\p{L}\p{N}\s.,!?~…]/gu, ''), line.villain ? { pitch: 0.4, rate: 0.85, male: true } : { rate: 0.95 });
    return () => stopSpeaking();
  }, [line]);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, advance]);

  if (!dialog || !line) return null;
  const last = dialog.idx + 1 >= dialog.lines.length;
  return (
    <div className={styles.dialogWrap} onClick={advance}>
      <div className={[styles.dialog, line.villain && styles.villainLine].filter(Boolean).join(' ')} role="dialog" aria-label="대화" key={`${dialog.idx}${line.text}`}>
        {line.who && <p className={styles.who}>{line.who}</p>}
        <p className={styles.line}>{line.text}</p>
        <button
          className={styles.nextBtn}
          onClick={(e) => {
            e.stopPropagation();
            advance();
          }}
          aria-label={last ? '닫기' : '다음'}
          autoFocus
        >
          {last ? '확인' : '다음 ▶'}
        </button>
      </div>
    </div>
  );
}
