import { defineGame } from '../types';
import { BunnyMathThumbnail } from './Thumbnail';

export default defineGame({
  id: 'bunny-math',
  title: '토리의 숫자 숲',
  description: '토끼 토리랑 세고, 깡충 뛰며 더하고 빼요',
  category: 'math',
  tags: ['세기', '수 길', '더하기·빼기'],
  ages: [4, 7],
  color: '#e3f6d5',
  Thumbnail: BunnyMathThumbnail,
  load: () => import('./index'),
  order: 0,
  badge: 'new',
});
