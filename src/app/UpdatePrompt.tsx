import { useEffect } from 'react';
import { applyUpdate, usePwa } from './pwa';
import styles from './UpdatePrompt.module.css';

/** 새 버전 알림 + 오프라인 준비 완료 토스트 */
export function UpdatePrompt() {
  const { needRefresh, offlineReady, dismissUpdate, dismissOfflineReady } = usePwa();

  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(dismissOfflineReady, 3000);
    return () => clearTimeout(t);
  }, [offlineReady, dismissOfflineReady]);

  if (needRefresh) {
    return (
      <div className={styles.banner} role="alertdialog" aria-label="새 버전 알림">
        <span className={styles.text}>✨ 새 버전이 있어요!</span>
        <button className={styles.primary} onClick={() => void applyUpdate()}>
          업데이트
        </button>
        <button className={styles.later} onClick={dismissUpdate}>
          나중에
        </button>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className={styles.banner} role="status" onClick={dismissOfflineReady}>
        <span className={styles.text}>인터넷 없이도 할 수 있어요 ✓</span>
      </div>
    );
  }

  return null;
}
