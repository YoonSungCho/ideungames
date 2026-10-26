import { useEffect, useState } from 'react';
import { callName } from '@/shared/korean';
import { speak, stopSpeaking } from '@/shared/sound/speak';
import { FRIENDS } from '../data/items';
import type { Speaker, StoryLine } from '../data/story';
import { useBunnyMath } from '../store';
import { Tori } from './Tori';
import styles from './Bunny.module.css';

/** 말하는 친구별 목소리 높낮이 */
const VOICE: Partial<Record<Speaker, { pitch: number; rate: number; male?: boolean }>> = {
  tori: { pitch: 1.35, rate: 0.95 },
  bear: { pitch: 0.7, rate: 0.85, male: true },
  raccoon: { pitch: 0.8, rate: 0.9, male: true },
  owl: { pitch: 0.75, rate: 0.85, male: true },
  mouse: { pitch: 1.5, rate: 1 },
  bee: { pitch: 1.4, rate: 1 },
};

/** 이야기 장면: 화면 아무 데나 눌러 넘기고, 소리로 읽어 준다. 언제든 건너뛰기 */
export function Cutscene({ lines, onDone, title }: { lines: StoryLine[]; onDone: () => void; title: string }) {
  const name = useBunnyMath((s) => s.player);
  const [i, setI] = useState(0);
  const fill = (t: string) => t.replaceAll('{call}', callName(name)).replaceAll('{name}', name);
  const line = lines[i];

  useEffect(() => {
    if (line) speak(fill(line.text), VOICE[line.who] ?? { pitch: 1.15, rate: 0.95 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);
  useEffect(() => () => stopSpeaking(), []);
  if (!line) return null;

  const next = () => (i + 1 < lines.length ? setI(i + 1) : (stopSpeaking(), onDone()));
  const who = line.who === 'narrator' ? null : FRIENDS[line.who];

  return (
    <div className={styles.cutscene} role="dialog" aria-label={title} onClick={next}>
      <button
        className={styles.skip}
        onClick={(e) => {
          e.stopPropagation();
          stopSpeaking();
          onDone();
        }}
      >
        건너뛰기 ⏭
      </button>
      <div className={styles.cutStage} key={i}>
        <div className={styles.portrait} aria-hidden>
          {line.who === 'tori' ? <Tori mood="happy" size={120} /> : who ? <span className={styles.portraitEmoji}>{who.emoji}</span> : <span className={styles.portraitEmoji}>🌕</span>}
        </div>
        <div className={styles.cutBubble}>
          {who && <b className={styles.cutName}>{who.name}</b>}
          <p>{fill(line.text)}</p>
          <button className={styles.nextLine} onClick={(e) => (e.stopPropagation(), next())}>
            {i + 1 < lines.length ? '다음 ▶' : '좋아! ▶'}
          </button>
        </div>
      </div>
      <div className={styles.cutDots} aria-hidden>
        {lines.map((_, k) => (
          <span key={k} className={k <= i ? styles.on : undefined} />
        ))}
      </div>
    </div>
  );
}
