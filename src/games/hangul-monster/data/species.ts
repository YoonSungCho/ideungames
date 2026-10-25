import type { QuestionType } from '../../hangul-hero/engine/types';

/**
 * 한글 몬스터 도감 데이터.
 * 속성(Elem)마다 쓰는 기술 = 푸는 한글 문제가 다르다 → 여러 속성의 몬스터를 모을수록 여러 한글을 배운다.
 */
export type Elem = 'consonant' | 'vowel' | 'batchim' | 'word' | 'chaos';

export const ELEM_INFO: Record<Elem, { name: string; icon: string; color: string }> = {
  consonant: { name: '자음', icon: '🔥', color: '#ff7a3c' },
  vowel: { name: '모음', icon: '💧', color: '#3f9cf5' },
  batchim: { name: '받침', icon: '🪨', color: '#a0764f' },
  word: { name: '낱말', icon: '🌿', color: '#3fb56a' },
  chaos: { name: '뒤죽박죽', icon: '🌀', color: '#7b5cc4' },
};

/** 불(자음) → 풀(낱말) → 물·땅, 물(모음) → 불·땅, 땅(받침) → 불 */
const STRONG: Record<Elem, Elem[]> = {
  consonant: ['word'],
  word: ['vowel', 'batchim'],
  vowel: ['consonant', 'batchim'],
  batchim: ['consonant'],
  chaos: [],
};

export function effectiveness(attack: Elem, defend: Elem) {
  if (STRONG[attack].includes(defend)) return 1.5;
  if (STRONG[defend].includes(attack)) return 0.75;
  return 1;
}

export interface Move {
  name: string;
  elem: Elem;
  power: number;
  /** 이 기술을 쓰려면 푸는 문제 */
  q: QuestionType[];
  options: number;
}

export const MOVES = {
  c_punch: { name: '자음 펀치', elem: 'consonant', power: 9, q: ['listenConsonant'], options: 3 },
  c_headbutt: { name: '첫소리 박치기', elem: 'consonant', power: 12, q: ['firstSound'], options: 3 },
  c_storm: { name: '자음 불꽃폭풍', elem: 'consonant', power: 16, q: ['listenConsonant', 'firstSound'], options: 4 },
  v_squirt: { name: '모음 물대포', elem: 'vowel', power: 9, q: ['listenVowel'], options: 3 },
  v_wave: { name: '모음 파도', elem: 'vowel', power: 12, q: ['syllableVowel'], options: 3 },
  v_swirl: { name: '글자 소용돌이', elem: 'vowel', power: 16, q: ['combine'], options: 4 },
  b_stone: { name: '받침 돌팔매', elem: 'batchim', power: 10, q: ['batchimRead'], options: 3 },
  b_quake: { name: '받침 지진', elem: 'batchim', power: 13, q: ['batchimPick'], options: 3 },
  b_rock: { name: '받침 바위꽝', elem: 'batchim', power: 17, q: ['batchimRead', 'batchimPick'], options: 4 },
  w_leaf: { name: '낱말 잎날리기', elem: 'word', power: 10, q: ['pictureWord'], options: 3 },
  w_vine: { name: '빈칸 덩굴채찍', elem: 'word', power: 13, q: ['missingSyllable'], options: 3 },
  w_group: { name: '무리 짓기 빔', elem: 'word', power: 16, q: ['categoryPick', 'oddOneOut'], options: 4 },
  w_opposite: { name: '반대말 번개', elem: 'word', power: 18, q: ['oppositePick'], options: 4 },
  // 뒤죽박죽단 몬스터만 쓰는 기술 (상대 차례라 문제가 없다)
  x_mess: { name: '뒤죽박죽 펀치', elem: 'chaos', power: 10, q: [], options: 0 },
  x_storm: { name: '엉망진창 폭풍', elem: 'chaos', power: 15, q: [], options: 0 },
} satisfies Record<string, Move>;

export type MoveId = keyof typeof MOVES;
export const move = (id: MoveId): Move => MOVES[id];

/** 속성별로 배우는 기술 [레벨, 기술] */
const LEARN: Record<Elem, [number, MoveId][]> = {
  consonant: [[1, 'c_punch'], [5, 'c_headbutt'], [12, 'c_storm']],
  vowel: [[1, 'v_squirt'], [5, 'v_wave'], [12, 'v_swirl']],
  batchim: [[1, 'b_stone'], [5, 'b_quake'], [12, 'b_rock']],
  word: [[1, 'w_leaf'], [5, 'w_vine'], [12, 'w_group'], [18, 'w_opposite']],
  chaos: [[1, 'x_mess'], [10, 'x_storm']],
};

export type Shape = 'blob' | 'beast' | 'bird' | 'fish' | 'rock' | 'sprout' | 'ghost';

export interface Species {
  name: string;
  elem: Elem;
  /** 배에 쓰인 글자 */
  letter: string;
  color: string;
  shape: Shape;
  /** 진화한 모습 (그림이 커지고 왕관·뿔이 생김) */
  stage: 1 | 2;
  hp: number;
  atk: number;
  /** 진화 (to는 SpeciesId — 타입이 자기 자신을 가리키지 않게 문자열로 둠) */
  evolve?: { to: string; at: number };
  /** 도감 설명 */
  about: string;
}

const S = (
  name: string, elem: Elem, letter: string, color: string, shape: Shape, about: string,
  o: { stage?: 1 | 2; hp?: number; atk?: number; evolve?: { to: string; at: number } } = {},
): Species => ({ name, elem, letter, color, shape, about, stage: o.stage ?? 1, hp: o.hp ?? 18, atk: o.atk ?? 1, evolve: o.evolve });

export const SPECIES = {
  // 첫 친구 셋
  giyeok: S('기역몬', 'consonant', 'ㄱ', '#ff8a4c', 'beast', '꼬리 끝이 ㄱ자로 꺾인 불꽃 몬스터. 기운이 넘친다.', { hp: 20, evolve: { to: 'giga', at: 12 } }),
  giga: S('기가몬', 'consonant', 'ㄱ', '#ff5a2c', 'beast', '기역몬이 자란 모습. 뿔에서 자음 불꽃이 튄다.', { stage: 2, hp: 24, atk: 1.15 }),
  aya: S('아야몽', 'vowel', 'ㅏ', '#4cb0ff', 'fish', '"아!" 하고 물방울을 뿜는 모음 몬스터.', { hp: 21, evolve: { to: 'ayaking', at: 12 } }),
  ayaking: S('아야킹', 'vowel', 'ㅏ', '#2f86e8', 'fish', '아야몽이 자란 모습. 파도를 타고 노래한다.', { stage: 2, hp: 25, atk: 1.12 }),
  ssak: S('새싹말', 'word', '가', '#5fc27e', 'sprout', '머리의 새싹에서 낱말이 피어나는 몬스터.', { hp: 20, evolve: { to: 'malnamu', at: 12 } }),
  malnamu: S('말나무', 'word', '가', '#3a9c55', 'sprout', '새싹말이 자란 모습. 잎마다 낱말이 적혀 있다.', { stage: 2, hp: 25, atk: 1.12 }),

  // 자음 숲
  nieun: S('니은몽', 'consonant', 'ㄴ', '#ffb35c', 'blob', 'ㄴ자로 누워 낮잠을 잔다. 느긋한 성격.'),
  digeut: S('디귿새', 'consonant', 'ㄷ', '#ff7f9f', 'bird', '날개가 ㄷ자 모양. 다다다 빠르게 난다.', { atk: 1.05 }),
  mieum: S('미음콩', 'consonant', 'ㅁ', '#c98bff', 'blob', '네모난 콩 몬스터. 말랑말랑하다.', { hp: 20 }),
  bieup: S('비읍토', 'consonant', 'ㅂ', '#ffa05c', 'beast', '귀가 ㅂ자로 쫑긋. 부지런히 뛰어다닌다.', { evolve: { to: 'bieupdae', at: 14 } }),
  bieupdae: S('비읍대왕', 'consonant', 'ㅂ', '#f07a2a', 'beast', '비읍토가 자란 모습. 숲의 대장.', { stage: 2, hp: 23, atk: 1.15 }),
  hieut: S('히읗별', 'consonant', 'ㅎ', '#ffc93c', 'bird', '아주 드물게 나타나는 별빛 몬스터. 하하 웃는다.', { hp: 19, atk: 1.15 }),

  // 모음 바닷가
  oo: S('오오게', 'vowel', 'ㅗ', '#5ccfff', 'blob', '"오오!" 하며 집게를 드는 바닷가 몬스터.'),
  uu: S('우우리', 'vowel', 'ㅜ', '#7aa8ff', 'blob', '우울할 땐 우우 노래를 부른다.', { hp: 20 }),
  iigo: S('이이고래', 'vowel', 'ㅣ', '#3d7bd9', 'fish', '등에서 ㅣ자 물기둥을 뿜는다.', { hp: 22 }),
  eo: S('어어파', 'vowel', 'ㅓ', '#5fd8c8', 'bird', '바닷바람을 타는 갈매기 몬스터.', { atk: 1.05 }),
  yuyu: S('유유니', 'vowel', 'ㅠ', '#9fe3ff', 'ghost', '아주 드문 물안개 몬스터. 유유히 떠다닌다.', { hp: 20, atk: 1.1 }),

  // 받침 동굴
  gom: S('곰곰이', 'batchim', '곰', '#b07a52', 'beast', '곰곰이 생각하는 곰 몬스터. 받침 ㅁ이 자랑.', { hp: 21, evolve: { to: 'gomdae', at: 16 } }),
  gomdae: S('곰대장', 'batchim', '곰', '#8a5a36', 'beast', '곰곰이가 자란 모습. 동굴을 지킨다.', { stage: 2, hp: 26, atk: 1.15 }),
  dol: S('돌돌이', 'batchim', '돌', '#9a8f86', 'rock', '데굴데굴 구르는 돌 몬스터.', { hp: 22, evolve: { to: 'bawi', at: 16 } }),
  bawi: S('바위돌', 'batchim', '돌', '#7d7269', 'rock', '돌돌이가 자란 모습. 아주 단단하다.', { stage: 2, hp: 27, atk: 1.1 }),
  bak: S('박쥐박', 'batchim', '박', '#8a6bd1', 'bird', '동굴 천장에 거꾸로 매달려 잔다.', { atk: 1.05 }),
  san: S('산산이', 'batchim', '산', '#7c9a5a', 'rock', '등이 산처럼 뾰족한 몬스터.', { hp: 21 }),
  byeol: S('별똥이', 'batchim', '별', '#f4c542', 'bird', '아주 드물게 동굴에 떨어지는 별 몬스터.', { hp: 20, atk: 1.15 }),

  // 낱말 꽃밭
  sagwa: S('사과몬', 'word', '사과', '#ff5a5a', 'blob', '빨갛고 동그란 사과 몬스터. 달콤한 냄새.', { hp: 20 }),
  nabi: S('나비랑', 'word', '나비', '#ff9fd4', 'bird', '날갯짓으로 낱말 가루를 뿌린다.', { atk: 1.05 }),
  gureum: S('구름이', 'word', '구름', '#dbe8ff', 'ghost', '몽실몽실 떠다니는 구름 몬스터.', { hp: 22 }),
  mujigae: S('무지개몬', 'word', '무지개', '#ff8ad8', 'bird', '비 온 뒤에만 보이는 아주 드문 몬스터.', { hp: 21, atk: 1.15 }),

  // 뒤죽박죽단
  eongmang: S('엉망이', 'chaos', '?!', '#8f7bb5', 'ghost', '글자를 엉망으로 섞어 버리는 장난꾸러기.'),
  dwijuk: S('뒤죽몬', 'chaos', '뒤', '#6e5ca8', 'ghost', '뒤죽박죽단의 부하 몬스터.', { hp: 20, atk: 1.05 }),
  bakjuk: S('박죽몬', 'chaos', '죽', '#a85c9e', 'ghost', '뒤죽박죽단의 부하 몬스터.', { hp: 20, atk: 1.05 }),
  king: S('뒤죽박죽킹', 'chaos', '⁉', '#4b3a7a', 'ghost', '뒤죽박죽단 대장의 몬스터. 한글을 몽땅 훔치려 한다.', { stage: 2, hp: 28, atk: 1.2 }),
} satisfies Record<string, Species>;

export type SpeciesId = keyof typeof SPECIES;
export const species = (id: SpeciesId): Species => SPECIES[id];
export const SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[];
/** 도감 번호 순서 (뒤죽박죽단 몬스터는 잡을 수 없어서 빼고) */
export const DEX = SPECIES_IDS.filter((id) => SPECIES[id].elem !== 'chaos');
export const STARTERS: SpeciesId[] = ['giyeok', 'aya', 'ssak'];

/** 이 레벨까지 배운 기술 (최대 4개, 최근 것 위주) */
export function movesAt(id: SpeciesId, level: number): MoveId[] {
  return LEARN[species(id).elem].filter(([lv]) => lv <= level).map(([, m]) => m).slice(-4);
}

/** 이 레벨이 되면 새로 배우는 기술 */
export function learnsAt(id: SpeciesId, level: number): MoveId | undefined {
  return LEARN[species(id).elem].find(([lv]) => lv === level)?.[1];
}
