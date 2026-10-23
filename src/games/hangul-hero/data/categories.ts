/**
 * 낱말 사전의 주제(무리). 무리 짓기 문제("과일을 찾아 줘", "하나만 다른 것")에 쓴다.
 *
 * 오답 보기는 "다른 집안(family)"의 무리에서만 고르고, 겹칠 수 있는 무리(conflicts)도 피한다.
 * 예) "음식을 찾아 줘"에 닭(동물)이 나오면 답이 둘이 될 수 있다 → food ↔ animal 충돌.
 */
export type Category =
  | 'animal' | 'plant' | 'weather' | 'land' | 'space'
  | 'fruit' | 'vegetable' | 'food'
  | 'vehicle' | 'clothes' | 'instrument' | 'school' | 'home' | 'tool' | 'toy'
  | 'sport' | 'body' | 'people' | 'story' | 'place' | 'color';

export interface CategoryInfo {
  /** 화면에 보이는 무리 이름 */
  name: string;
  emoji: string;
  family: 'nature' | 'food' | 'thing' | 'play' | 'body' | 'people' | 'place' | 'color';
  /** 무리 짓기에서 묻는 말 */
  ask: string;
  conflicts?: Category[];
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  animal: { name: '동물', emoji: '🐾', family: 'nature', ask: '동물을 찾아 줘!', conflicts: ['food', 'story'] },
  plant: { name: '식물', emoji: '🌿', family: 'nature', ask: '꽃·나무·풀 같은 식물을 찾아 줘!', conflicts: ['fruit', 'vegetable', 'food'] },
  weather: { name: '날씨', emoji: '🌦️', family: 'nature', ask: '날씨와 관련된 말을 찾아 줘!' },
  land: { name: '자연', emoji: '🏞️', family: 'nature', ask: '산·강·바다처럼 자연에 있는 것을 찾아 줘!', conflicts: ['place', 'fruit', 'vegetable', 'food'] },
  space: { name: '하늘과 우주', emoji: '🌌', family: 'nature', ask: '하늘 높이, 우주에 있는 것을 찾아 줘!', conflicts: ['vehicle'] },
  fruit: { name: '과일', emoji: '🍎', family: 'food', ask: '과일을 찾아 줘!', conflicts: ['plant'] },
  vegetable: { name: '채소', emoji: '🥕', family: 'food', ask: '채소를 찾아 줘!', conflicts: ['plant'] },
  food: { name: '음식', emoji: '🍚', family: 'food', ask: '먹는 음식을 찾아 줘!', conflicts: ['animal', 'plant'] },
  vehicle: { name: '탈것', emoji: '🚗', family: 'thing', ask: '타고 다니는 탈것을 찾아 줘!', conflicts: ['space'] },
  clothes: { name: '옷과 꾸미개', emoji: '👕', family: 'thing', ask: '입거나 신거나 몸에 거는 것을 찾아 줘!' },
  instrument: { name: '악기', emoji: '🎵', family: 'thing', ask: '소리를 내는 악기를 찾아 줘!' },
  school: { name: '학용품', emoji: '✏️', family: 'thing', ask: '공부할 때 쓰는 학용품을 찾아 줘!' },
  home: { name: '집 안 물건', emoji: '🏠', family: 'thing', ask: '집에서 쓰는 물건을 찾아 줘!' },
  tool: { name: '도구와 재료', emoji: '🔨', family: 'thing', ask: '만들거나 고칠 때 쓰는 것을 찾아 줘!' },
  toy: { name: '놀이와 장난감', emoji: '🧸', family: 'thing', ask: '갖고 노는 장난감이나 놀이를 찾아 줘!', conflicts: ['sport'] },
  sport: { name: '운동', emoji: '🏅', family: 'play', ask: '운동 이름을 찾아 줘!', conflicts: ['toy'] },
  body: { name: '몸', emoji: '💪', family: 'body', ask: '우리 몸의 한 부분을 찾아 줘!' },
  people: { name: '사람', emoji: '🧑', family: 'people', ask: '사람을 부르는 말을 찾아 줘!' },
  story: { name: '이야기 속 친구', emoji: '🧚', family: 'people', ask: '옛이야기·동화에 나오는 친구를 찾아 줘!', conflicts: ['animal'] },
  place: { name: '장소', emoji: '🏙️', family: 'place', ask: '찾아갈 수 있는 장소를 찾아 줘!', conflicts: ['land'] },
  color: { name: '색깔', emoji: '🎨', family: 'color', ask: '색깔 이름을 찾아 줘!' },
};

/** cat 문제의 오답으로 써도 되는 무리 */
export function farCategories(cat: Category): Category[] {
  const me = CATEGORIES[cat];
  return (Object.keys(CATEGORIES) as Category[]).filter((c) => {
    const o = CATEGORIES[c];
    return o.family !== me.family && !me.conflicts?.includes(c) && !o.conflicts?.includes(cat);
  });
}
