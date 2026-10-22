import { Button } from '@/shared/ui/Button';
import styles from './StartOverlay.module.css';

interface StartOverlayProps {
  /** true: 시작 전, false: 멈춤 중 */
  ready: boolean;
  /** 시작 전 제목 (예: "3×3 블록 · 쉬움") */
  title: string;
  onStart: () => void;
  readyHint?: string;
  pausedHint?: string;
}

/**
 * 시작 전 / 멈춤 중에 게임판 위를 덮는 카드 (시간은 누를 때부터).
 * 부모는 position: relative 이고, 가려야 할 게임판은 부모가 흐리게 처리한다.
 */
export function StartOverlay({ ready, title, onStart, readyHint = '누르면 시간이 흘러가요', pausedHint = '다시 시작하면 보여요' }: StartOverlayProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <p className={styles.title}>{ready ? title : '잠깐 쉬는 중'}</p>
        <Button size="lg" className={styles.startBtn} onClick={onStart} autoFocus>
          ▶ {ready ? '시작하기' : '계속하기'}
        </Button>
        <p className={styles.hint}>{ready ? readyHint : pausedHint}</p>
      </div>
    </div>
  );
}
