import { useEffect, useState } from 'react';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { Robot, type RobotMood } from '@/shared/ui/Robot';
import { useSudoku } from '../store';
import styles from './Sudoku.module.css';

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** 보드 옆에서 반응해 주는 로봇 친구 */
export function Coach() {
  const event = useSudoku((s) => s.event);
  const name = useSettings((s) => s.playerName);
  const [line, setLine] = useState<{ text: string; mood: RobotMood }>({ text: '숫자 카드를 골라 봐!', mood: 'idle' });

  useEffect(() => {
    if (!event) return;
    const lines: Record<typeof event.kind, () => { text: string; mood: RobotMood }> = {
      start: () => ({ text: `${callName(name)}, 같이 풀어 보자!`, mood: 'happy' }),
      place: () => ({ text: pick(['좋아!', '맞았어!', '멋져!', '역시!', '잘하는데?']), mood: 'happy' }),
      wrong: () => ({ text: pick(['앗, 다시 생각해 볼까?', '음… 그 숫자는 아닌 것 같아', '괜찮아, 다시 해 보자!']), mood: 'oops' }),
      complete: () => ({ text: pick(['한 줄 완성! 대단해!', '와, 다 채웠다!', '반짝반짝 완성!']), mood: 'cheer' }),
      hint: () => ({ text: '띠봇이 살짝 알려 줄게!', mood: 'happy' }),
      win: () => ({ text: `${callName(name)}, 해냈어!`, mood: 'cheer' }),
    };
    setLine(lines[event.kind]());
    if (event.kind === 'win') return;
    const t = setTimeout(() => setLine((l) => ({ ...l, mood: 'idle' })), 1600);
    return () => clearTimeout(t);
  }, [event, name]);

  return (
    <div className={styles.coach}>
      <Robot mood={line.mood} size={64} key={line.mood === 'oops' ? `oops${event?.key}` : 'robot'} />
      <p className={styles.bubble} key={`line${event?.key}`} aria-live="polite">
        {line.text}
      </p>
    </div>
  );
}
