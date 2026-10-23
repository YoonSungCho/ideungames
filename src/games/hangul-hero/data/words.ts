/**
 * 낱말 그림 사전 — 이모지는 안드로이드·iOS 기본 글꼴에서 잘 보이는 것만.
 * 첫 글자 자음/모음 문제, 받침 문제, 낱말 문제에 함께 쓴다.
 */
export interface Word {
  word: string;
  emoji: string;
}

export const WORDS: Word[] = [
  // 받침 없는 낱말
  { word: '사자', emoji: '🦁' }, { word: '나무', emoji: '🌳' }, { word: '바다', emoji: '🌊' }, { word: '오리', emoji: '🦆' },
  { word: '하마', emoji: '🦛' }, { word: '기차', emoji: '🚂' }, { word: '모자', emoji: '🧢' }, { word: '포도', emoji: '🍇' },
  { word: '우유', emoji: '🥛' }, { word: '치즈', emoji: '🧀' }, { word: '피자', emoji: '🍕' }, { word: '버스', emoji: '🚌' },
  { word: '거미', emoji: '🕷️' }, { word: '나비', emoji: '🦋' }, { word: '고기', emoji: '🍖' }, { word: '토끼', emoji: '🐰' },
  { word: '여우', emoji: '🦊' }, { word: '바나나', emoji: '🍌' }, { word: '토마토', emoji: '🍅' }, { word: '아기', emoji: '👶' },
  { word: '가지', emoji: '🍆' }, { word: '사과', emoji: '🍎' }, { word: '라디오', emoji: '📻' }, { word: '코끼리', emoji: '🐘' },
  { word: '야구', emoji: '⚾' }, { word: '요트', emoji: '⛵' }, { word: '유령', emoji: '👻' }, { word: '드럼', emoji: '🥁' },
  { word: '주스', emoji: '🧃' }, { word: '시계', emoji: '⏰' }, { word: '구두', emoji: '👞' }, { word: '로봇', emoji: '🤖' },
  // 받침 있는 낱말
  { word: '곰', emoji: '🐻' }, { word: '달', emoji: '🌙' }, { word: '별', emoji: '⭐' }, { word: '물', emoji: '💧' },
  { word: '불', emoji: '🔥' }, { word: '눈', emoji: '⛄' }, { word: '책', emoji: '📚' }, { word: '공', emoji: '⚽' },
  { word: '집', emoji: '🏠' }, { word: '밥', emoji: '🍚' }, { word: '빵', emoji: '🍞' }, { word: '문', emoji: '🚪' },
  { word: '산', emoji: '⛰️' }, { word: '손', emoji: '✋' }, { word: '발', emoji: '🦶' }, { word: '귤', emoji: '🍊' },
  { word: '양', emoji: '🐑' }, { word: '말', emoji: '🐴' }, { word: '뱀', emoji: '🐍' },
  { word: '돈', emoji: '💰' }, { word: '꿀', emoji: '🍯' }, { word: '종', emoji: '🔔' }, { word: '컵', emoji: '🥤' },
  { word: '수박', emoji: '🍉' }, { word: '사탕', emoji: '🍬' }, { word: '연필', emoji: '✏️' }, { word: '우산', emoji: '☂️' },
  { word: '자동차', emoji: '🚗' }, { word: '고양이', emoji: '🐱' }, { word: '강아지', emoji: '🐶' }, { word: '거북이', emoji: '🐢' },
  { word: '원숭이', emoji: '🐒' }, { word: '호랑이', emoji: '🐯' }, { word: '딸기', emoji: '🍓' }, { word: '당근', emoji: '🥕' },
  { word: '햄버거', emoji: '🍔' }, { word: '선물', emoji: '🎁' }, { word: '풍선', emoji: '🎈' }, { word: '기린', emoji: '🦒' },
  { word: '펭귄', emoji: '🐧' }, { word: '문어', emoji: '🐙' }, { word: '고래', emoji: '🐋' }, { word: '상어', emoji: '🦈' },
  { word: '비행기', emoji: '✈️' }, { word: '물고기', emoji: '🐟' }, { word: '옥수수', emoji: '🌽' }, { word: '케이크', emoji: '🎂' },
];

/** 첫소리 자음 문제용: 기본 자음마다 확실한 대표 낱말 */
export const FIRST_SOUND: Record<string, string[]> = {
  ㄱ: ['곰', '고래', '기린', '가지'], ㄴ: ['나비', '나무', '눈'], ㄷ: ['달', '당근', '돈'], ㄹ: ['라디오', '로봇'],
  ㅁ: ['모자', '물', '문어', '말'], ㅂ: ['바나나', '버스', '별', '불'], ㅅ: ['사자', '사과', '수박', '산'], ㅇ: ['오리', '우유', '우산', '양'],
  ㅈ: ['집', '주스', '종'], ㅊ: ['치즈', '책'], ㅋ: ['코끼리', '컵', '케이크'], ㅌ: ['토끼', '토마토'],
  ㅍ: ['포도', '피자', '풍선', '펭귄'], ㅎ: ['하마', '호랑이', '햄버거'],
};

/** 첫 글자 모음 문제용 */
export const FIRST_VOWEL: Record<string, string[]> = {
  ㅏ: ['사자', '나무', '바다', '하마'], ㅑ: ['야구', '양'], ㅓ: ['거미', '버스', '거북이'], ㅕ: ['여우', '별', '연필'],
  ㅗ: ['오리', '모자', '포도', '토끼'], ㅛ: ['요트'], ㅜ: ['우유', '구두', '우산'], ㅠ: ['유령'],
  ㅡ: ['드럼'], ㅣ: ['기차', '치즈', '피자', '기린'],
};

/** 문장 하늘: 그림 + 문장. blank는 빈칸으로 낼 어절 */
export interface Sentence {
  emoji: string;
  words: string[];
  blank: number;
  /** 빈칸 오답 보기 (같은 꼴의 어절) */
  wrong: string[];
}

export const SENTENCES: Sentence[] = [
  { emoji: '🐰🥕', words: ['토끼가', '당근을', '먹어요'], blank: 1, wrong: ['우유를', '공을', '모자를'] },
  { emoji: '🐱🥛', words: ['고양이가', '우유를', '마셔요'], blank: 1, wrong: ['당근을', '책을', '빵을'] },
  { emoji: '🐶⚽', words: ['강아지가', '공을', '굴려요'], blank: 1, wrong: ['물을', '밥을', '꽃을'] },
  { emoji: '🐦☁️', words: ['새가', '하늘을', '날아요'], blank: 2, wrong: ['먹어요', '자요', '울어요'] },
  { emoji: '🐟💧', words: ['물고기가', '물에서', '헤엄쳐요'], blank: 2, wrong: ['날아요', '뛰어요', '먹어요'] },
  { emoji: '👶💤', words: ['아기가', '쿨쿨', '자요'], blank: 2, wrong: ['먹어요', '날아요', '읽어요'] },
  { emoji: '☀️✨', words: ['해가', '반짝반짝', '빛나요'], blank: 0, wrong: ['달이', '비가', '눈이'] },
  { emoji: '🌧️☂️', words: ['비가', '주룩주룩', '와요'], blank: 0, wrong: ['해가', '별이', '꽃이'] },
  { emoji: '🐻🍯', words: ['곰이', '꿀을', '먹어요'], blank: 1, wrong: ['공을', '물을', '책을'] },
  { emoji: '🧒📚', words: ['나는', '책을', '읽어요'], blank: 1, wrong: ['밥을', '공을', '물을'] },
  { emoji: '🐸🌊', words: ['개구리가', '폴짝', '뛰어요'], blank: 2, wrong: ['자요', '마셔요', '읽어요'] },
  { emoji: '🌸🌱', words: ['꽃이', '예쁘게', '피었어요'], blank: 0, wrong: ['새가', '비가', '곰이'] },
];

export const wordByText = (w: string) => WORDS.find((x) => x.word === w)!;
