import { defineConfig, devices } from '@playwright/test';

/**
 * E2E: 실제 빌드(vite preview)를 시스템 Chrome으로 돌린다.
 *   npm run e2e            # 빌드 + 전체 테스트
 *   npx playwright test -g 기록   # 일부만
 */
const PORT = 4180;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}/ideungames/`,
    channel: 'chrome',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], channel: 'chrome' } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/ideungames/`,
    reuseExistingServer: !process.env.CI,
  },
});
