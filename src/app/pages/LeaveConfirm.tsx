import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { useLeaveGuardStore } from '@/shared/leaveGuard';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

/** 게임 진행 중 다른 화면으로 나가려 하면 확인한다. 같은 게임 안의 화면·설정은 그냥 이동. */
export function LeaveConfirm({ gamePath }: { gamePath: string }) {
  const active = useLeaveGuardStore((s) => s.active);
  const guardWithinGame = useLeaveGuardStore((s) => s.guardWithinGame);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      active &&
      currentLocation.pathname !== nextLocation.pathname &&
      nextLocation.pathname !== '/settings' &&
      (guardWithinGame || !nextLocation.pathname.startsWith(gamePath)),
  );
  const asking = blocker.state === 'blocked';

  useEffect(() => {
    useLeaveGuardStore.setState({ asking });
  }, [asking]);

  return (
    <ConfirmDialog
      open={asking}
      title="게임을 그만할까?"
      message="지금까지 한 건 저장돼서 다음에 이어서 할 수 있어요."
      cancelLabel="계속하기"
      confirmLabel="그만하기"
      onCancel={() => blocker.reset?.()}
      onConfirm={() => {
        useLeaveGuardStore.getState().onQuit?.();
        blocker.proceed?.();
      }}
    />
  );
}
