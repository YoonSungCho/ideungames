import { useNumberRain } from '../store';
import styles from './NumberRain.module.css';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

/**
 * 숫자 패드. 세로 화면은 2줄(1~5 ⌫ / 6~0 ✔)로 낮게 → 하늘을 크게,
 * 가로 화면은 오른쪽 칸에 4줄(CSS가 순서를 바꾼다).
 */
export function Keypad() {
  const input = useNumberRain((s) => s.game?.input ?? '');
  // 3과 34가 같이 있을 때 3을 누르면 ✔를 눌러야 터진다 → ✔를 반짝여 알려준다
  const needsOk = useNumberRain((s) => !!s.game?.input && s.game.drops.some((d) => String(d.q.answer) === s.game!.input));
  const { typeDigit, backspace, submit } = useNumberRain.getState();
  return (
    <div className={styles.keypad} role="group" aria-label="숫자 패드">
      {DIGITS.map((k) => (
        <button key={k} className={[styles.key, styles[`n${k}`]].join(' ')} onClick={() => typeDigit(k)} aria-label={`${k}`}>
          {k}
        </button>
      ))}
      <button className={[styles.key, styles.keyFn, styles.keyBack].join(' ')} onClick={backspace} disabled={!input} aria-label="지우기">
        ⌫
      </button>
      <button className={[styles.key, styles.keyOk, needsOk && styles.okHint].filter(Boolean).join(' ')} onClick={submit} disabled={!input} aria-label="확인">
        ✔
      </button>
    </div>
  );
}
