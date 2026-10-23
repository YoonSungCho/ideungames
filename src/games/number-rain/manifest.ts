import { defineGame } from '../types';
import { NumberRainThumbnail } from './Thumbnail';

export default defineGame({
  id: 'number-rain',
  title: '숫자 비',
  description: '떨어지는 숫자를 땅에 닿기 전에 펑! 💣 폭탄은 한꺼번에!',
  category: 'math',
  tags: ['숫자', '계산', '순발력'],
  ages: [4, 10],
  color: '#dff1ff',
  Thumbnail: NumberRainThumbnail,
  load: () => import('./index'),
  order: 4,
  badge: 'new',
});
