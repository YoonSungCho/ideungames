import { defineGame } from '../types';
import { QuickMathThumbnail } from './Thumbnail';

export default defineGame({
  id: 'quick-math',
  title: '빠른 계산',
  description: '덧셈·뺄셈·구구단! 누가 더 빨리 풀까?',
  category: 'math',
  tags: ['계산', '구구단', '스피드'],
  ages: [5, 10],
  color: '#ffeccf',
  Thumbnail: QuickMathThumbnail,
  load: () => import('./index'),
  order: 2,
  badge: 'new',
});
