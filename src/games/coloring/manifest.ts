import { defineGame } from '../types';
import { ColoringThumbnail } from './Thumbnail';

export default defineGame({
  id: 'coloring',
  title: '색칠 놀이',
  description: '누르면 칠해지는 색칠 그림! 무늬 붓·무지개 붓으로 꾸며요',
  category: 'art',
  tags: ['색칠', '그리기', '색깔'],
  ages: [3, 9],
  color: '#fff1d6',
  Thumbnail: ColoringThumbnail,
  load: () => import('./index'),
  order: 8,
  badge: 'new',
});
