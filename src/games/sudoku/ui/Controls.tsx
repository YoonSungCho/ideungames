import type { ReactNode } from 'react';
import { BulbIcon, EraseIcon, PencilIcon, UndoIcon } from '@/shared/ui/icons';
import { useSudoku } from '../store';
import styles from './Sudoku.module.css';

function Tool({ icon, label, onClick, active, badge, disabled }: {
  icon: ReactNode; label: string; onClick: () => void; active?: boolean; badge?: ReactNode; disabled?: boolean;
}) {
  return (
    <button className={[styles.tool, active && styles.toolActive].filter(Boolean).join(' ')} onClick={onClick} disabled={disabled} aria-pressed={active}>
      <span className={styles.toolIcon}>
        {icon}
        {badge !== undefined && <span className={styles.toolBadge}>{badge}</span>}
      </span>
      <span className={styles.toolLabel}>{label}</span>
    </button>
  );
}

export function Controls({ maxHints }: { maxHints: number }) {
  const game = useSudoku((s) => s.game)!;
  const canUndo = useSudoku((s) => s.history.length > 0);
  const noteMode = useSudoku((s) => s.noteMode);
  const { undo, erase, toggleNoteMode, hint } = useSudoku.getState();
  const hintsLeft = maxHints - game.hintsUsed;
  const finite = Number.isFinite(maxHints);

  return (
    <div className={styles.controls}>
      <Tool icon={<UndoIcon />} label="되돌리기" onClick={undo} disabled={!canUndo} />
      <Tool icon={<EraseIcon />} label="지우기" onClick={erase} />
      <Tool icon={<PencilIcon />} label="메모" onClick={toggleNoteMode} active={noteMode} badge={noteMode ? 'ON' : 'OFF'} />
      <Tool icon={<BulbIcon />} label="힌트" onClick={() => hint(maxHints)} disabled={hintsLeft <= 0} badge={finite ? hintsLeft : undefined} />
    </div>
  );
}
