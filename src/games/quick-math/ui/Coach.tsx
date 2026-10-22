import { useEffect, useState } from 'react';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { Robot, type RobotMood } from '@/shared/ui/Robot';
import { useQuickMath } from '../store';
import styles from './QuickMath.module.css';

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** 가로 화면 오른쪽 칸에서 반응해 주는 띠봇 */
export function Coach() {
  const event = useQuickMath((s) => s.event);
  const combo = useQuickMath((s) => s.session?.combo ?? 0);
  const status = useQuickMath((s) => s.session?.status);
  const paused = useQuickMath((s) => s.paused);
  const name = useSettings((s) => s.playerName);
  const [line, setLine] = useState<{ text: string; mood: RobotMood }>({ text: '준비됐어?', mood: 'idle' });

  useEffect(() => {
    if (!event) return;
    if (event.kind === 'start') setLine({ text: `${callName(name)}, 시작!`, mood: 'happy' });
    if (event.kind === 'correct')
      setLine(combo >= 5 && combo % 5 === 0 ? { text: `${combo}연속! 불타오른다! 🔥`, mood: 'cheer' } : { text: pick(['딩동댕!', '맞았어!', '빠르다!', '좋아!']), mood: 'happy' });
    if (event.kind === 'wrong') setLine({ text: pick(['아까워!', '다시 해 보자!', '천천히 생각해 봐']), mood: 'oops' });
    if (event.kind === 'reveal') setLine({ text: '괜찮아, 이렇게 하는 거야!', mood: 'think' });
    if (event.kind === 'done') setLine({ text: `${callName(name)}, 끝까지 해냈어!`, mood: 'cheer' });
  }, [event, combo, name]);

  const shown =
    status === 'ready' ? { text: `${callName(name)}, 준비되면 시작하기를 눌러 줘!`, mood: 'happy' as const }
    : status === 'playing' && paused ? { text: '쉬는 중이야. 다시 하려면 계속하기!', mood: 'think' as const }
    : line;

  return (
    <div className={styles.coach}>
      <Robot mood={shown.mood} size={60} key={shown.mood === 'oops' ? `oops${event?.key}` : 'robot'} />
      <p className={styles.bubble} key={`line${event?.key}`} aria-live="polite">{shown.text}</p>
    </div>
  );
}
