import { defineGame } from '../types';
import { MazeEscapeThumbnail } from './Thumbnail';

export default defineGame({
  id: 'maze-escape',
  title: '미로 탈출',
  description: '꼬불꼬불 미로를 지나 맛있는 간식을 찾아가요! 별도 모아 봐요',
  category: 'puzzle',
  tags: ['미로', '길 찾기', '공간'],
  ages: [4, 10],
  color: '#e6f4d4',
  Thumbnail: MazeEscapeThumbnail,
  load: () => import('./index'),
  order: 7,
  badge: 'new',
});
