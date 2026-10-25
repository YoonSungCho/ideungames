import type { SpeciesId } from './species';

/**
 * 걸어 다니는 지도. 한 글자 = 한 칸.
 *  # 나무  ~ 물  o 바위  C 동굴 벽  K 성벽            → 못 지나감
 *  . 풀밭  = 길  s 모래  * 꽃  _ 다리  c 동굴 바닥  k 성 바닥 → 지나감
 *  , 수풀  ; 어두운 동굴 바닥                          → 지나가면 야생 몬스터가 나올 수 있음
 *  L 연구소  H 우리 집  M 상점  P 몬스터 센터  G 체육관   → 부딪히면 들어감
 * 모든 지도는 위·아래 가운데 길(9번째 칸)로 이어진다.
 */
export type MapId = 'town' | 'forest' | 'beach' | 'cave' | 'flower' | 'castle';

export type Building = 'lab' | 'home' | 'shop' | 'center' | 'gym';
export const BUILDING_TILE: Record<string, Building> = { L: 'lab', H: 'home', M: 'shop', P: 'center', G: 'gym' };
export const BUILDING_EMOJI: Record<Building, string> = { lab: '🏫', home: '🏠', shop: '🏬', center: '🏥', gym: '🏟️' };
export const BUILDING_NAME: Record<Building, string> = { lab: '한글 연구소', home: '우리 집', shop: '상점', center: '몬스터 센터', gym: '체육관' };

export const WALK = new Set(['.', '=', 's', '*', '_', 'c', 'k', ',', ';']);
export const GRASS = new Set([',', ';']);

export interface Exit {
  x: number;
  y: number;
  to: MapId;
  tx: number;
  ty: number;
}

export interface GameMap {
  name: string;
  emoji: string;
  rows: string[];
  /** 바닥 기본 색 테마 */
  theme: 'town' | 'forest' | 'beach' | 'cave' | 'flower' | 'castle';
  exits: Exit[];
  wild?: { table: [SpeciesId, number][]; lv: [number, number] };
  /** 이 지도의 체육관 (배지 번호 0~3) */
  gym?: number;
  /** 몬스터 센터 앞 (쓰러지면 돌아오는 곳) */
  heal: [number, number];
}

const TOP = (to: MapId, ty: number): Exit => ({ x: 9, y: 0, to, tx: 9, ty });
const BOTTOM = (h: number, to: MapId): Exit => ({ x: 9, y: h - 1, to, tx: 9, ty: 2 });

export const MAPS: Record<MapId, GameMap> = {
  town: {
    name: '가나 마을', emoji: '🏘️', theme: 'town', heal: [13, 4],
    rows: [
      '#########=##########',
      '#########=##########',
      '##.......=.......###',
      '##..L....=....H..###',
      '##.......=.......###',
      '##...==========..###',
      '##...=...........###',
      '##...=..M...P....###',
      '##...=...........###',
      '##...======......###',
      '##**.............~~#',
      '##**.............~~#',
      '##...............###',
      '####################',
    ],
    exits: [TOP('forest', 16)],
  },
  forest: {
    name: '자음 숲', emoji: '🌲', theme: 'forest', gym: 0, heal: [13, 4],
    rows: [
      '#########=##########',
      '#########=##########',
      '##,,,,...=...,,,,,##',
      '##,,,G...=...P.,,,##',
      '##,,.....=......,,##',
      '##.......=........##',
      '####..,,,=,,,..#####',
      '####..,,,=,,,..#####',
      '##.......=........##',
      '##.###...=...###..##',
      '##.###.,,=,,.###..##',
      '##.....,,=,,......##',
      '##,,,,...=...,,,,,##',
      '##,,,,...=...,,,,,##',
      '##.......=........##',
      '##.......=........##',
      '#########=##########',
      '#########=##########',
    ],
    exits: [TOP('beach', 16), BOTTOM(18, 'town')],
    wild: { table: [['nieun', 30], ['digeut', 25], ['mieum', 25], ['bieup', 20], ['hieut', 4]], lv: [2, 5] },
  },
  beach: {
    name: '모음 바닷가', emoji: '🏖️', theme: 'beach', gym: 1, heal: [12, 4],
    rows: [
      '#########=##########',
      '#########=##########',
      '#~~~~....=....~~~~~#',
      '#~~~~.G..=..P.~~~~~#',
      '#~~......=.......~~#',
      '#~...ssss=ssss....~#',
      '#~.,,,,ss=ss,,,,,.~#',
      '#~.,,,,ss=ss,,,,,.~#',
      '#~~~~~~~~_~~~~~~~~~#',
      '#~~~~~~~~_~~~~~~~~~#',
      '#~.,,,,ss=ss,,,,,.~#',
      '#~.,,,,ss=ss,,,,,.~#',
      '#~..sssss=sssss...~#',
      '#~~......=.....M.~~#',
      '#~~~.....=.......~~#',
      '#~~~~....=....~~~~~#',
      '#########=##########',
      '#########=##########',
    ],
    exits: [TOP('cave', 15), BOTTOM(18, 'forest')],
    wild: { table: [['oo', 30], ['uu', 25], ['iigo', 20], ['eo', 25], ['yuyu', 4]], lv: [6, 9] },
  },
  cave: {
    name: '받침 동굴', emoji: '🕳️', theme: 'cave', gym: 2, heal: [13, 4],
    rows: [
      'CCCCCCCCCcCCCCCCCCCC',
      'CCCCCCCCCcCCCCCCCCCC',
      'CCccccccccccccccccCC',
      'CCcccGcccccccPccccCC',
      'CCccccccccccccccccCC',
      'CC;;;;CCCcCCC;;;;;CC',
      'CC;;;;cccccccc;;;;CC',
      'CCccccccccccccooccCC',
      'CCooccc;;c;;ccccccCC',
      'CCccccc;;c;;ccccccCC',
      'CC;;;;cccccccc;;;;CC',
      'CC;;;;CCCcCCCC;;;;CC',
      'CCcccccccccccccccMCC',
      'CCccccccccccccccccCC',
      'CCCCcccccccccccCCCCC',
      'CCCCCCCCCcCCCCCCCCCC',
      'CCCCCCCCCcCCCCCCCCCC',
    ],
    exits: [TOP('flower', 16), BOTTOM(17, 'beach')],
    wild: { table: [['gom', 25], ['dol', 25], ['bak', 25], ['san', 25], ['byeol', 4]], lv: [10, 13] },
  },
  flower: {
    name: '낱말 꽃밭', emoji: '🌷', theme: 'flower', gym: 3, heal: [14, 4],
    rows: [
      '#########=##########',
      '#########=##########',
      '##*****..=..*****.##',
      '##*.G....=....P.*.##',
      '##.......=........##',
      '##,,,,,*.=.*,,,,,,##',
      '##,,,,,*.=.*,,,,,,##',
      '##.......=........##',
      '##*..###.=.###..*.##',
      '##*,,###,=,###,,*.##',
      '##.,,,,,,=,,,,,,..##',
      '##.......=......M.##',
      '##**.....=.....**.##',
      '##,,,,...=...,,,,.##',
      '##,,,,...=...,,,,.##',
      '##.......=........##',
      '#########=##########',
      '#########=##########',
    ],
    exits: [TOP('castle', 14), BOTTOM(18, 'cave')],
    wild: { table: [['sagwa', 30], ['nabi', 30], ['gureum', 30], ['mujigae', 4]], lv: [14, 17] },
  },
  castle: {
    name: '뒤죽박죽 성', emoji: '🏰', theme: 'castle', heal: [12, 10],
    rows: [
      'KKKKKKKKKKKKKKKKKKKK',
      'KKKKKKKKKKKKKKKKKKKK',
      'KKKKkkkkkkkkkkkKKKKK',
      'KKKKkkkkkkkkkkkKKKKK',
      'KKKKkkkkkkkkkkkKKKKK',
      'KKKKKKKKKkKKKKKKKKKK',
      'KKKKkkkkkkkkkkkKKKKK',
      'KKKKkkkkkkkkkkkKKKKK',
      'KKKKKKKKKkKKKKKKKKKK',
      'KKKKkkkkkkkkkkkKKKKK',
      'KKKKkkkkkkkkkPkKKKKK',
      'KKKKKKKKKkKKKKKKKKKK',
      'KKKKkkkkkkkkkkkKKKKK',
      'KKKKkkkkkkkkkkkKKKKK',
      'KKKKKKKKKkKKKKKKKKKK',
      'KKKKKKKKKkKKKKKKKKKK',
    ],
    exits: [BOTTOM(16, 'flower')],
  },
};

export const BADGES = [
  { name: '자음 배지', icon: '🔥' },
  { name: '모음 배지', icon: '💧' },
  { name: '받침 배지', icon: '🪨' },
  { name: '낱말 배지', icon: '🌿' },
] as const;

/** 대사 한 줄. who가 없으면 해설 */
export interface Line {
  who?: string;
  text: string;
  /** 악당은 낮고 굵은 목소리 */
  villain?: boolean;
}

export interface Npc {
  id: string;
  map: MapId;
  x: number;
  y: number;
  emoji: string;
  name: string;
  /** talk: 말만, trainer: 승부, gym: 관장(건물 안), item: 땅에 떨어진 물건, guard: 배지가 있어야 비켜 줌 */
  kind: 'talk' | 'trainer' | 'gym' | 'item' | 'guard' | 'boss';
  lines: Line[];
  /** 이긴 뒤 다시 말 걸면 */
  after?: Line[];
  team?: [SpeciesId, number][];
  /** guard: 필요한 배지 수 */
  needBadges?: number;
  item?: { id: ItemId; count: number };
  /** 이기면 사라짐 (길을 막던 뒤죽박죽단) */
  leaves?: boolean;
  villain?: boolean;
}

export type ItemId = 'ball' | 'potion' | 'bigPotion';
export const ITEMS: Record<ItemId, { name: string; emoji: string; price: number; about: string }> = {
  ball: { name: '한글볼', emoji: '🔴', price: 30, about: '야생 몬스터를 잡아요. 힘이 약할수록 잘 잡혀요.' },
  potion: { name: '회복약', emoji: '🧃', price: 40, about: '체력을 25 회복해요.' },
  bigPotion: { name: '큰 회복약', emoji: '🍯', price: 100, about: '체력을 모두 회복해요.' },
};
export const POTION_HP = 25;

const V = (text: string): Line => ({ who: '뒤죽박죽단', text, villain: true });

export const NPCS: Npc[] = [
  // 가나 마을
  {
    id: 'grunt0', map: 'town', x: 9, y: 1, emoji: '🦹', name: '뒤죽박죽단 졸개', kind: 'trainer', leaves: true, villain: true,
    lines: [V('히히! 우리는 뒤죽박죽단! 한글을 몽땅 엉망으로 만들 거야!'), V('여기는 못 지나가! 덤벼라!')],
    after: [V('으앙, 졌다! 대장님께 이를 거야!')],
    team: [['eongmang', 3]],
  },
  { id: 'town-kid', map: 'town', x: 7, y: 11, emoji: '👧', name: '마을 친구', kind: 'talk', lines: [{ who: '마을 친구', text: '풀숲에 들어가면 야생 몬스터가 튀어나와! 문제를 빨리 맞히면 급소에 맞는대!' }] },
  { id: 'town-ball', map: 'town', x: 3, y: 12, emoji: '✨', name: '반짝이는 것', kind: 'item', item: { id: 'potion', count: 2 }, lines: [] },

  // 자음 숲
  { id: 'forest-guard', map: 'forest', x: 9, y: 1, emoji: '💂', name: '숲 지기', kind: 'guard', needBadges: 1, lines: [{ who: '숲 지기', text: '이 앞은 모음 바닷가야. 자음 체육관에서 배지를 받아 와야 지나갈 수 있어!' }] },
  {
    id: 'forest-kid', map: 'forest', x: 4, y: 8, emoji: '🧒', name: '곤충 소년 다온', kind: 'trainer',
    lines: [{ who: '곤충 소년 다온', text: '내 몬스터는 자음을 아주 잘 알아! 승부하자!' }],
    after: [{ who: '곤충 소년 다온', text: '우와, 자음 소리를 정말 잘 듣는구나!' }],
    team: [['nieun', 4], ['mieum', 4]],
  },
  {
    id: 'forest-girl', map: 'forest', x: 15, y: 13, emoji: '👩', name: '산책하는 누나 하늘', kind: 'trainer',
    lines: [{ who: '하늘', text: '첫소리를 잘 들어 봐! 나랑 겨뤄 볼래?' }],
    after: [{ who: '하늘', text: '최고야! 체육관 관장님도 이길 수 있겠어.' }],
    team: [['bieup', 5], ['digeut', 6]],
  },
  { id: 'forest-ball', map: 'forest', x: 17, y: 9, emoji: '✨', name: '반짝이는 것', kind: 'item', item: { id: 'ball', count: 3 }, lines: [] },
  {
    id: 'gym0', map: 'forest', x: 5, y: 3, emoji: '🧑‍🚒', name: '자음 관장 불꽃', kind: 'gym',
    lines: [{ who: '자음 관장 불꽃', text: '어서 와! 나는 자음 체육관 관장 불꽃이야.' }, { who: '자음 관장 불꽃', text: 'ㄱ부터 ㅎ까지, 자음 소리를 잘 들어야 이길 수 있어!' }],
    after: [{ who: '자음 관장 불꽃', text: '자음 배지 🔥를 줄게! 이제 모음 바닷가로 갈 수 있어.' }],
    team: [['digeut', 7], ['bieup', 8]],
  },

  // 모음 바닷가
  { id: 'beach-guard', map: 'beach', x: 9, y: 1, emoji: '💂', name: '바닷가 지기', kind: 'guard', needBadges: 2, lines: [{ who: '바닷가 지기', text: '동굴은 위험해! 모음 배지가 있어야 들여보내 줄게.' }] },
  {
    id: 'beach-swim', map: 'beach', x: 3, y: 12, emoji: '🏊', name: '수영 선수 바다', kind: 'trainer',
    lines: [{ who: '수영 선수 바다', text: '아, 야, 어, 여! 모음 노래 부르며 승부!' }],
    after: [{ who: '수영 선수 바다', text: '모음 소리를 쏙쏙 알아듣는구나!' }],
    team: [['oo', 8], ['uu', 9]],
  },
  {
    id: 'beach-fish', map: 'beach', x: 15, y: 6, emoji: '🧔', name: '낚시꾼 아저씨', kind: 'trainer',
    lines: [{ who: '낚시꾼', text: '월척이다! 내 이이고래랑 겨뤄 보자!' }],
    after: [{ who: '낚시꾼', text: '허허, 내가 낚였구먼!' }],
    team: [['iigo', 10], ['eo', 9]],
  },
  { id: 'beach-item', map: 'beach', x: 3, y: 6, emoji: '✨', name: '반짝이는 것', kind: 'item', item: { id: 'bigPotion', count: 1 }, lines: [] },
  {
    id: 'grunt1', map: 'beach', x: 9, y: 13, emoji: '🦹', name: '뒤죽박죽단 졸개', kind: 'trainer', leaves: true, villain: true,
    lines: [V('모음을 다 섞어 버리면 아무도 글을 못 읽겠지? 히히!')],
    after: [V('끄응… 이 꼬마 정말 세잖아!')],
    team: [['eongmang', 8], ['dwijuk', 9]],
  },
  {
    id: 'gym1', map: 'beach', x: 6, y: 3, emoji: '🧜', name: '모음 관장 물결', kind: 'gym',
    lines: [{ who: '모음 관장 물결', text: '파도처럼 출렁이는 모음! ㅏ ㅑ ㅓ ㅕ… 모두 구별할 수 있니?' }],
    after: [{ who: '모음 관장 물결', text: '훌륭해! 모음 배지 💧를 줄게.' }],
    team: [['eo', 11], ['iigo', 12]],
  },

  // 받침 동굴
  { id: 'cave-guard', map: 'cave', x: 9, y: 1, emoji: '💂', name: '동굴 지기', kind: 'guard', needBadges: 3, lines: [{ who: '동굴 지기', text: '받침 배지를 가진 사람만 꽃밭으로 나갈 수 있어.' }] },
  {
    id: 'cave-miner', map: 'cave', x: 3, y: 7, emoji: '👷', name: '광부 단단', kind: 'trainer',
    lines: [{ who: '광부 단단', text: '곰, 공, 곱! 받침이 바뀌면 낱말이 바뀌지. 알고 있니?' }],
    after: [{ who: '광부 단단', text: '받침 보석을 캐는 눈을 가졌구나!' }],
    team: [['dol', 12], ['gom', 13]],
  },
  {
    id: 'cave-climber', map: 'cave', x: 15, y: 9, emoji: '🧗', name: '탐험가 별이', kind: 'trainer',
    lines: [{ who: '탐험가 별이', text: '동굴 깊은 곳까지 왔구나! 나랑 겨뤄 보자!' }],
    after: [{ who: '탐험가 별이', text: '너 진짜 대단한 탐험가다!' }],
    team: [['bak', 14], ['san', 13]],
  },
  { id: 'cave-item', map: 'cave', x: 17, y: 13, emoji: '✨', name: '반짝이는 것', kind: 'item', item: { id: 'ball', count: 5 }, lines: [] },
  {
    id: 'gym2', map: 'cave', x: 5, y: 3, emoji: '🧙', name: '받침 관장 바위', kind: 'gym',
    lines: [{ who: '받침 관장 바위', text: '글자 아래를 단단히 받쳐 주는 받침! 그 힘을 보여 주지.' }],
    after: [{ who: '받침 관장 바위', text: '받침 배지 🪨를 받아라. 꽃밭이 너를 기다린다!' }],
    team: [['san', 15], ['gom', 16]],
  },

  // 낱말 꽃밭
  { id: 'flower-guard', map: 'flower', x: 9, y: 1, emoji: '💂', name: '꽃밭 지기', kind: 'guard', needBadges: 4, lines: [{ who: '꽃밭 지기', text: '저 위가 뒤죽박죽 성이야! 배지 4개를 모은 진짜 용사만 갈 수 있어.' }] },
  {
    id: 'flower-artist', map: 'flower', x: 4, y: 11, emoji: '👩‍🎨', name: '화가 누리', kind: 'trainer',
    lines: [{ who: '화가 누리', text: '그림을 보고 낱말을 읽을 수 있니? 승부!' }],
    after: [{ who: '화가 누리', text: '네 낱말 실력은 그림처럼 아름다워!' }],
    team: [['nabi', 16], ['sagwa', 16]],
  },
  {
    id: 'flower-poet', map: 'flower', x: 14, y: 13, emoji: '🧑‍🏫', name: '시인 한별', kind: 'trainer',
    lines: [{ who: '시인 한별', text: '크다와 작다, 높다와 낮다… 반대말 승부다!' }],
    after: [{ who: '시인 한별', text: '반대말을 척척! 시를 써도 되겠어.' }],
    team: [['gureum', 17], ['nabi', 17]],
  },
  { id: 'flower-item', map: 'flower', x: 17, y: 2, emoji: '✨', name: '반짝이는 것', kind: 'item', item: { id: 'bigPotion', count: 2 }, lines: [] },
  {
    id: 'gym3', map: 'flower', x: 4, y: 3, emoji: '🧝', name: '낱말 관장 꽃잎', kind: 'gym',
    lines: [{ who: '낱말 관장 꽃잎', text: '자음과 모음과 받침이 모이면 낱말이 피어나지. 마지막 배지를 걸고 승부!' }],
    after: [{ who: '낱말 관장 꽃잎', text: '낱말 배지 🌿! 이제 배지 4개야. 뒤죽박죽 성으로 가서 한글을 되찾아 줘!' }],
    team: [['nabi', 18], ['mujigae', 19]],
  },

  // 뒤죽박죽 성
  {
    id: 'grunt2', map: 'castle', x: 9, y: 11, emoji: '🦹', name: '뒤죽박죽단 졸개', kind: 'trainer', leaves: true, villain: true,
    lines: [V('여기까지 오다니! 하지만 성 안은 못 들어가!')],
    after: [V('으악! 비켜 줄게!')],
    team: [['eongmang', 18], ['dwijuk', 19]],
  },
  {
    id: 'grunt3', map: 'castle', x: 9, y: 8, emoji: '🦹‍♀️', name: '뒤죽박죽단 간부 박죽', kind: 'trainer', leaves: true, villain: true,
    lines: [V('나는 간부 박죽! 글자를 뒤섞는 건 내 특기지!')],
    after: [V('말도 안 돼… 대장님, 조심하세요!')],
    team: [['bakjuk', 20], ['eongmang', 20]],
  },
  {
    id: 'grunt4', map: 'castle', x: 9, y: 5, emoji: '🦹‍♂️', name: '뒤죽박죽단 간부 뒤죽', kind: 'trainer', leaves: true, villain: true,
    lines: [V('나는 간부 뒤죽! 대장님께 가려면 나를 넘어야 해!')],
    after: [V('크윽… 네 한글 실력, 인정한다!')],
    team: [['dwijuk', 21], ['bakjuk', 21]],
  },
  {
    id: 'boss', map: 'castle', x: 9, y: 3, emoji: '👺', name: '뒤죽박죽 대장', kind: 'boss', villain: true,
    lines: [
      V('하하하! 네가 소문의 꼬마 트레이너로구나.'),
      V('한글이 엉망이 되면 아무도 책을 못 읽고, 편지도 못 쓰지! 그게 내 계획이다!'),
      V('내 뒤죽박죽킹을 이길 수 있을까? 덤벼라!'),
    ],
    after: [{ who: '뒤죽박죽 대장', text: '으아아… 한글이… 다시 반짝반짝해진다…!', villain: true }],
    team: [['eongmang', 22], ['dwijuk', 23], ['king', 25]],
  },
];

export const npcById = (id: string) => NPCS.find((n) => n.id === id);
