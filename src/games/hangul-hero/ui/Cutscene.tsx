import { useEffect, useState } from 'react';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { speak, stopSpeaking } from '@/shared/sound/speak';
import { Robot } from '@/shared/ui/Robot';
import { SPEAKER_NAME, type Line, type Speaker } from '../data/story';
import { Hero, Imp } from './characters';
import styles from './HangulHero.module.css';

/** 말하는 사람별 목소리. 마왕 쌍둥이는 남성 음성(있으면) + 아주 낮고 느릿하게 — 뒤죽이 더 굵고, 박죽은 조금 높고 능글맞게 */
const VOICE: Record<Speaker, { pitch: number; rate: number; male?: boolean }> = {
  hero: { pitch: 1.25, rate: 0.95 },
  bot: { pitch: 1.4, rate: 0.95 },
  dwijuk: { pitch: 0.3, rate: 0.82, male: true },
  bakjuk: { pitch: 0.5, rate: 0.88, male: true },
  narrator: { pitch: 1, rate: 0.95 },
};

function Portrait({ speaker }: { speaker: Speaker }) {
  if (speaker === 'hero') return <Hero mood="happy" size={130} />;
  if (speaker === 'bot') return <Robot mood="happy" size={110} />;
  if (speaker === 'dwijuk') return <Imp who="dwijuk" mood="laugh" size={130} />;
  if (speaker === 'bakjuk') return <Imp who="bakjuk" mood="laugh" size={130} />;
  return <span className={styles.narratorIcon} aria-hidden>📜</span>;
}

/** 이야기 장면: 말풍선을 눌러 넘기고, 소리로 읽어 준다. 언제든 건너뛸 수 있다. */
export function Cutscene({ lines, onDone, title }: { lines: Line[]; onDone: () => void; title?: string }) {
  const name = useSettings((s) => s.playerName);
  const [i, setI] = useState(0);
  const fill = (t: string) => t.replaceAll('{name}', name).replaceAll('{call}', callName(name));
  const line = lines[i];

  useEffect(() => {
    if (line) speak(fill(line.text), VOICE[line.speaker]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => {
    if (!line) onDone();
  }, [line, onDone]);
  if (!line) return null;

  const next = () => (i + 1 < lines.length ? setI(i + 1) : (stopSpeaking(), onDone()));
  const villain = line.speaker === 'dwijuk' || line.speaker === 'bakjuk';

  return (
    <div className={[styles.cutscene, villain && styles.cutsceneDark].filter(Boolean).join(' ')} role="dialog" aria-label={title ?? '이야기'} onClick={next}>
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
        <div className={styles.portrait}>
          <Portrait speaker={line.speaker} />
        </div>
        <div className={styles.cutBubble}>
          {SPEAKER_NAME[line.speaker] && <b className={styles.speaker}>{fill(SPEAKER_NAME[line.speaker])}</b>}
          <p>{fill(line.text)}</p>
          <button className={styles.nextLine} onClick={(e) => (e.stopPropagation(), next())}>
            {i + 1 < lines.length ? '다음 ▶' : '시작! ▶'}
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
