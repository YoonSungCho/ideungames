import { defineGame } from '../types';
import { SudokuThumbnail } from './Thumbnail';

export default defineGame({
  id: 'sudoku',
  title: '스도쿠',
  description: '2×2 블록부터 3×3 블록까지! 숫자 퍼즐',
  category: 'puzzle',
  tags: ['숫자', '논리'],
  ages: [5, 10],
  color: '#e9e4ff',
  Thumbnail: SudokuThumbnail,
  load: () => import('./index'),
  order: 1,
  badge: 'new',
});
