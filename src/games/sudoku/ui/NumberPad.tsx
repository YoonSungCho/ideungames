import { isEditable, remainingOf, useSudoku } from '../store';
import styles from './Sudoku.module.css';

export function NumberPad() {
  const game = useSudoku((s) => s.game)!;
  const armed = useSudoku((s) => s.armed);
  const selected = useSudoku((s) => s.selected);
  const noteMode = useSudoku((s) => s.noteMode);
  const pressNumber = useSudoku((s) => s.pressNumber);
  const cellReady = selected !== null && isEditable(game, selected);

  return (
    <div className={styles.pad} style={{ ['--n' as string]: game.spec.size }}>
      {Array.from({ length: game.spec.size }, (_, k) => {
        const n = k + 1;
        const left = remainingOf(game, n);
        const done = left === 0;
        return (
          <button
            key={n}
            className={[
              styles.card,
              styles[`c${n}`],
              armed === n && styles.armed,
              done && styles.done,
              noteMode && styles.noteCard,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => pressNumber(n)}
            disabled={done && !noteMode}
            aria-pressed={armed === n}
            aria-label={`숫자 ${n}, ${done ? '모두 찾음' : `${left}개 남음`}${cellReady ? '' : ', 눌러서 들고 있기'}`}
          >
            <span className={styles.cardNum}>{n}</span>
            <span className={styles.badge}>{done ? '✓' : left}</span>
          </button>
        );
      })}
    </div>
  );
}
