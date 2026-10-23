import { defineGame } from '../types';
import { HangulHeroThumbnail } from './Thumbnail';

export default defineGame({
  id: 'hangul-hero',
  title: '한글 용사',
  description: '뒤죽박죽 마왕에게서 한글 나라를 구하자!',
  category: 'word',
  tags: ['한글', '모험', '자음·모음'],
  ages: [4, 8],
  color: '#d9f2e4',
  Thumbnail: HangulHeroThumbnail,
  load: () => import('./index'),
  order: 3,
  badge: 'new',
});
