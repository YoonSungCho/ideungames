import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { useLeaveGuardStore } from '@/shared/leaveGuard';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { Robot } from '@/shared/ui/Robot';
import styles from './pages.module.css';

/** 게임 진행 중 다른 화면으로 나가려 하면 확인한다. 설정 화면은 잠깐 다녀올 수 있게 허용. */
export function LeaveConfirm() {
  const active = useLeaveGuardStore((s) => s.active);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      active && currentLocation.pathname !== nextLocation.pathname && nextLocation.pathname !== '/settings',
  );
  const asking = blocker.state === 'blocked';

  useEffect(() => {
    useLeaveGuardStore.setState({ asking });
  }, [asking]);

  return (
    <Modal open={asking} onClose={() => blocker.reset?.()} labelledBy="leave-title">
      <div className={styles.leave}>
        <Robot mood="think" size={90} />
        <h2 id="leave-title">게임을 그만할까?</h2>
        <p>지금까지 한 건 저장돼서 다음에 이어서 할 수 있어요.</p>
        <div className={styles.leaveActions}>
          <Button size="lg" onClick={() => blocker.reset?.()}>계속하기</Button>
          <Button variant="ghost" onClick={() => blocker.proceed?.()}>그만하기</Button>
        </div>
      </div>
    </Modal>
  );
}
