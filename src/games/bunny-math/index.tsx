import { Navigate, Route, Routes } from 'react-router';
import { ChapterScreen } from './ui/ChapterScreen';
import { MapScreen } from './ui/MapScreen';
import { PlayScreen } from './ui/PlayScreen';

/** 토리의 숫자 숲: 지도 → 단원(친구) → 단계 놀이, 섞어 놀기 */
export default function BunnyMathGame() {
  return (
    <Routes>
      <Route index element={<MapScreen />} />
      <Route path="mix" element={<PlayScreen mix />} />
      <Route path=":chapterId" element={<ChapterScreen />} />
      <Route path=":chapterId/play" element={<PlayScreen />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
