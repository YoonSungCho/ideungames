import { createHashRouter, Outlet, RouterProvider } from 'react-router';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { UpdatePrompt } from './UpdatePrompt';

/**
 * GitHub Pages는 SPA 라우팅 fallback이 없으므로 hash 라우팅 사용 (#/games/sudoku).
 * data router라서 useBlocker(게임 중 나가기 확인)를 쓸 수 있다.
 */
const router = createHashRouter([
  {
    element: (
      <>
        <Outlet />
        <UpdatePrompt />
      </>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/games/:id', element: <GamePage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <HomePage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
