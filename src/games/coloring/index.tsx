import { Navigate, Route, Routes } from 'react-router';
import { Gallery } from './ui/Gallery';
import { Paint } from './ui/Paint';

/** 색칠 놀이: 시간 기록이 없는 자유 놀이라 시작하기·멈춤이 없고, 칠한 그림은 늘 저장된다 */
export default function ColoringGame() {
  return (
    <Routes>
      <Route index element={<Gallery />} />
      <Route path=":pic" element={<Paint />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
