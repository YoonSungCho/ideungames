import { defineGame } from '../types';
import { SudokuThumbnail } from './Thumbnail';

export default defineGame({
  id: 'sudoku',
  title: '스도쿠',
  description: '4×4부터 8×8까지! 줄마다 숫자를 한 번씩',
  category: 'puzzle',
  tags: ['숫자', '논리'],
  ages: [5, 10],
  color: '#e9e4ff',
  Thumbnail: SudokuThumbnail,
  load: () => import('./index'),
  order: 1,
  badge: 'new',
});
