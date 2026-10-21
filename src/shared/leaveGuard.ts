import { useEffect } from 'react';
import { create } from 'zustand';

/**
 * 게임이 "진행 중"임을 허브에 알리는 공용 장치.
 * 게임은 useLeaveGuard(진행중여부)만 호출하면 되고,
 * 나가기 확인 창은 GamePage가 띄운다 (뒤로 버튼·안드로이드 뒤로 제스처 모두).
 */
interface LeaveGuardState {
  active: boolean;
  /** 확인 창이 떠 있는 동안 — 게임은 타이머 등을 멈춘다 */
  asking: boolean;
}

export const useLeaveGuardStore = create<LeaveGuardState>(() => ({ active: false, asking: false }));

export function useLeaveGuard(active: boolean) {
  useEffect(() => {
    useLeaveGuardStore.setState({ active });
    return () => useLeaveGuardStore.setState({ active: false });
  }, [active]);
}

export const useLeaveAsking = () => useLeaveGuardStore((s) => s.asking);
