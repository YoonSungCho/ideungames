import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';
import { Modal } from './Modal';
import { Robot, type RobotMood } from './Robot';

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  message?: ReactNode;
  /** 위험한 쪽(취소·나가기) 버튼 */
  confirmLabel: string;
  /** 안전한 쪽(계속하기) 버튼 — 크게 강조 */
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  mood?: RobotMood;
}

/** 아이가 실수로 누르기 쉬운 동작을 한 번 더 묻는 창. 안전한 선택지를 크게 둔다. */
export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, mood = 'think' }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} labelledBy="confirm-title">
      <div className={styles.confirm}>
        <Robot mood={mood} size={90} />
        <h2 id="confirm-title">{title}</h2>
        {message && <p>{message}</p>}
        <div className={styles.actions}>
          <Button size="lg" onClick={onCancel} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant="ghost" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
