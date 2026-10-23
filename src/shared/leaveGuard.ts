import { useEffect } from 'react';
import { create } from 'zustand';

/**
 * 게임이 "진행 중"임을 허브에 알리는 공용 장치.
 * 게임은 useLeaveGuard(진행중여부, 그만할때)만 호출하면 되고,
 * 나가기 확인 창은 GamePage가 띄운다 (뒤로 버튼·안드로이드 뒤로 제스처 모두).
 */
interface LeaveGuardState {
  active: boolean;
  /** 확인 창이 떠 있는 동안 — 게임은 타이머 등을 멈춘다 */
  asking: boolean;
  /** 사용자가 "그만하기"를 골랐을 때 게임에 알려줌 (예: 다음엔 메뉴부터 보여주기) */
  onQuit?: () => void;
  /** true면 같은 게임 안의 다른 화면으로 갈 때도 묻는다 (예: 단계 진행 중 → 지역 화면) */
  guardWithinGame?: boolean;
}

export const useLeaveGuardStore = create<LeaveGuardState>(() => ({ active: false, asking: false }));

export function useLeaveGuard(active: boolean, onQuit?: () => void, guardWithinGame = false) {
  useEffect(() => {
    useLeaveGuardStore.setState({ active, onQuit, guardWithinGame });
    return () => useLeaveGuardStore.setState({ active: false, onQuit: undefined, guardWithinGame: false });
  }, [active, onQuit, guardWithinGame]);
}

export const useLeaveAsking = () => useLeaveGuardStore((s) => s.asking);
