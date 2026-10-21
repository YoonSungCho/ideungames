import { HashRouter, Route, Routes } from 'react-router';
import { GamePage } from './pages/GamePage';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { UpdatePrompt } from './UpdatePrompt';

/**
 * GitHub Pages는 SPA 라우팅 fallback이 없으므로 HashRouter 사용 (#/games/sudoku).
 */
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games/:id" element={<GamePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <UpdatePrompt />
    </HashRouter>
  );
}
