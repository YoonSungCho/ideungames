import { defineGame } from '../types';
import { MemoryCardsThumbnail } from './Thumbnail';

export default defineGame({
  id: 'memory-cards',
  title: '짝꿍 카드',
  description: '카드를 뒤집어 같은 짝을 찾아요! 그림과 글자 짝도 있어요',
  category: 'memory',
  tags: ['기억력', '카드', '그림', '낱말'],
  ages: [3, 9],
  color: '#ffe4ec',
  Thumbnail: MemoryCardsThumbnail,
  load: () => import('./index'),
  order: 6,
  badge: 'new',
});
