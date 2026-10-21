import { registerSW } from 'virtual:pwa-register';
import { create } from 'zustand';

/**
 * 서비스 워커(오프라인/업데이트) 상태.
 * - 앱을 다시 볼 때마다, 그리고 30분마다 새 버전을 확인한다.
 * - 새 버전을 받으면 needRefresh=true → UpdatePrompt가 알림을 띄우고 applyUpdate()로 적용.
 */
interface PwaState {
  needRefresh: boolean;
  offlineReady: boolean;
  dismissUpdate: () => void;
  dismissOfflineReady: () => void;
}

export const usePwa = create<PwaState>()((set) => ({
  needRefresh: false,
  offlineReady: false,
  dismissUpdate: () => set({ needRefresh: false }),
  dismissOfflineReady: () => set({ offlineReady: false }),
}));

export const APP_VERSION = __APP_VERSION__;
export const BUILD_ID = __BUILD_ID__;
export const BUILD_TIME = __BUILD_TIME__;

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
let registration: ServiceWorkerRegistration | undefined;

const updateSW = registerSW({
  onNeedRefresh: () => usePwa.setState({ needRefresh: true }),
  onOfflineReady: () => usePwa.setState({ offlineReady: true }),
  onRegisteredSW: (_url, r) => {
    registration = r;
    if (!r) return;
    const check = () => navigator.onLine && r.update().catch(() => {});
    setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
  },
});

/** 새 서비스 워커를 활성화하고 페이지를 새로고침한다. */
export async function applyUpdate() {
  await updateSW(true);
  // 페이지가 아직 서비스 워커의 제어를 받기 전이면 자동 새로고침 이벤트가 오지 않으므로 직접 새로고침
  setTimeout(() => location.reload(), 1500);
}

export type UpdateCheckResult = 'found' | 'latest' | 'offline' | 'unsupported';

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (usePwa.getState().needRefresh) return 'found';
  if (!registration) return 'unsupported';
  if (!navigator.onLine) return 'offline';
  try {
    await registration.update();
  } catch {
    return 'offline';
  }
  return registration.installing || registration.waiting ? 'found' : 'latest';
}
