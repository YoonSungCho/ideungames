import { StartOverlay as Overlay } from '@/shared/game/StartOverlay';
import { useSudoku } from '../store';
import { DIFFICULTY_LABEL, modeLabel } from './labels';

/** 시작 전 / 멈춤 중에 보드를 가리고 큰 시작 버튼을 보여준다 (시간은 누를 때부터). */
export function StartOverlay() {
  const game = useSudoku((s) => s.game)!;
  const start = useSudoku((s) => s.start);
  return (
    <Overlay
      ready={game.status === 'ready'}
      title={`${modeLabel(game.spec.size)} 블록 · ${DIFFICULTY_LABEL[game.difficulty]}`}
      onStart={start}
      pausedHint="보드는 다시 시작하면 보여요"
    />
  );
}
