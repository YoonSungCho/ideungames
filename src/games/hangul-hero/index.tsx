import { Navigate, Route, Routes } from 'react-router';
import { BookScreen } from './ui/BookScreen';
import { MapScreen } from './ui/MapScreen';
import { PlayScreen } from './ui/PlayScreen';
import { RegionScreen } from './ui/RegionScreen';

/** 한글 용사: 지도 → 지역 → 단계/보스, 도감 */
export default function HangulHeroGame() {
  return (
    <Routes>
      <Route index element={<MapScreen />} />
      <Route path="book" element={<BookScreen />} />
      <Route path=":regionId" element={<RegionScreen />} />
      <Route path=":regionId/play" element={<PlayScreen />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
