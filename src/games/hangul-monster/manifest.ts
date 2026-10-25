import { defineGame } from '../types';
import { HangulMonsterThumbnail } from './Thumbnail';

export default defineGame({
  id: 'hangul-monster',
  title: '한글 몬스터',
  description: '걸어 다니며 한글 몬스터를 만나고, 한글 문제로 겨루고, 친구로 모아요!',
  category: 'word',
  tags: ['한글', '모험', '배틀', '수집'],
  ages: [5, 9],
  color: '#e3f6d8',
  Thumbnail: HangulMonsterThumbnail,
  load: () => import('./index'),
  order: 5,
  badge: 'new',
});
