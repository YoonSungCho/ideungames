import { boxOf, colOf, rowOf } from '../engine';
import { useSudoku } from '../store';
import styles from './Sudoku.module.css';

export function Board() {
  const game = useSudoku((s) => s.game)!;
  const selected = useSudoku((s) => s.selected);
  const focus = useSudoku((s) => s.focus);
  const event = useSudoku((s) => s.event);
  const selectCell = useSudoku((s) => s.selectCell);
  const { spec, values, givens, solution, notes, hinted } = game;
  const focusValue = focus ?? 0;

  // 하이라이트 숫자가 이미 들어 있는 행/열/박스 → 그 숫자가 더 들어갈 수 없는 곳
  const covered = new Set<string>();
  if (focusValue) {
    values.forEach((v, i) => {
      if (v !== focusValue) return;
      covered.add(`r${rowOf(i, spec)}`).add(`c${colOf(i, spec)}`).add(`b${boxOf(i, spec)}`);
    });
  }

  return (
    <div
      className={styles.board}
      style={{ ['--n' as string]: spec.size, ['--box-r' as string]: spec.boxRows, ['--box-c' as string]: spec.boxCols }}
      role="grid"
      aria-label="스도쿠 보드"
    >
      {values.map((v, i) => {
        const r = rowOf(i, spec);
        const c = colOf(i, spec);
        const isPeer = focusValue
          ? covered.has(`r${r}`) || covered.has(`c${c}`) || covered.has(`b${boxOf(i, spec)}`)
          : selected !== null &&
            selected !== i &&
            (rowOf(selected, spec) === r || colOf(selected, spec) === c || boxOf(selected, spec) === boxOf(i, spec));
        const wrong = v !== 0 && v !== solution[i];
        const flash = event?.cells.includes(i) ? event.kind : null;
        const cls = [
          styles.cell,
          givens[i] ? styles.given : v ? styles.user : '',
          hinted.includes(i) && styles.hinted,
          wrong && styles.wrong,
          isPeer && styles.peer,
          focusValue !== 0 && v === focusValue && styles.same,
          selected === i && styles.selected,
          c === spec.size - 1 ? styles.lastCol : (c + 1) % spec.boxCols === 0 && styles.boxRight,
          r === spec.size - 1 ? styles.lastRow : (r + 1) % spec.boxRows === 0 && styles.boxBottom,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={i}
            className={cls}
            onClick={() => selectCell(i)}
            role="gridcell"
            aria-label={`${r + 1}행 ${c + 1}열 ${v ? v : '빈 칸'}${wrong ? ' (틀림)' : ''}`}
            aria-selected={selected === i}
          >
            {v !== 0 ? (
              <span key={flash ? `v${event!.key}` : 'v'} className={flash ? styles[`fx_${flash}`] : undefined}>
                {v}
              </span>
            ) : notes[i] ? (
              <span className={styles.notes} style={{ gridTemplateColumns: `repeat(${spec.boxCols}, 1fr)` }}>
                {Array.from({ length: spec.size }, (_, k) => (
                  <span key={k} className={focusValue === k + 1 ? styles.noteFocus : undefined}>
                    {notes[i] & (1 << (k + 1)) ? k + 1 : ''}
                  </span>
                ))}
              </span>
            ) : null}
            {flash === 'complete' && <span key={`s${event!.key}`} className={styles.sparkle} aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
