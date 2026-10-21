import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** 오프라인 준비가 끝나면 잠깐 알려준다. (registerType: autoUpdate라 새 버전은 자동 적용) */
export function UpdatePrompt() {
  const { offlineReady: [offlineReady, setOfflineReady] } = useRegisterSW();
  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 3000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);
  if (!offlineReady) return null;
  return (
    <div
      role="status"
      onClick={() => setOfflineReady(false)}
      style={{
        position: 'fixed', top: 'calc(12px + env(safe-area-inset-top))', left: '50%', translate: '-50% 0', zIndex: 60,
        background: 'var(--text)', color: '#fff', padding: '8px 16px', borderRadius: 999, whiteSpace: 'nowrap', cursor: 'pointer',
      }}
    >
      인터넷 없이도 할 수 있어요 ✓
    </div>
  );
}
