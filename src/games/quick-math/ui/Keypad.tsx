import { useQuickMath } from '../store';
import styles from './QuickMath.module.css';

const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'back', 0, 'ok'] as const;

/** 전화기 같은 숫자 패드. 자릿수만큼 누르면 자동 채점, ✔는 짧은 답을 바로 낼 때 */
export function Keypad() {
  const input = useQuickMath((s) => s.session?.input ?? '');
  const { typeDigit, backspace, submit } = useQuickMath.getState();
  return (
    <div className={styles.keypad} role="group" aria-label="숫자 패드">
      {KEYS.map((k) =>
        k === 'back' ? (
          <button key={k} className={[styles.key, styles.keyFn].join(' ')} onClick={backspace} disabled={!input} aria-label="지우기">
            ⌫
          </button>
        ) : k === 'ok' ? (
          <button key={k} className={[styles.key, styles.keyOk].join(' ')} onClick={submit} disabled={!input} aria-label="확인">
            ✔
          </button>
        ) : (
          <button key={k} className={styles.key} onClick={() => typeDigit(k)} aria-label={`${k}`}>
            {k}
          </button>
        ),
      )}
    </div>
  );
}
