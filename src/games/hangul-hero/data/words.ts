import { CONSONANTS, VOWELS, decompose } from '../engine/hangul';

/**
 * 낱말 그림 사전 — 이모지는 안드로이드·iOS 기본 글꼴에서 잘 보이는 것만, 낱말마다 그림이 겹치지 않게.
 * 첫소리 자음/모음 문제, 받침 문제, 낱말 문제, 도감에 함께 쓴다.
 * 낱말을 더하면 첫소리·첫 모음 표(FIRST_SOUND, FIRST_VOWEL)는 자동으로 늘어난다.
 */
export interface Word {
  word: string;
  emoji: string;
}

export const WORDS: Word[] = [
  // 동물
  { word: '사자', emoji: '🦁' }, { word: '하마', emoji: '🦛' }, { word: '오리', emoji: '🦆' }, { word: '거미', emoji: '🕷️' },
  { word: '나비', emoji: '🦋' }, { word: '토끼', emoji: '🐰' }, { word: '여우', emoji: '🦊' }, { word: '코끼리', emoji: '🐘' },
  { word: '곰', emoji: '🐻' }, { word: '양', emoji: '🐑' }, { word: '말', emoji: '🐴' }, { word: '뱀', emoji: '🐍' },
  { word: '소', emoji: '🐄' }, { word: '새', emoji: '🐦' }, { word: '벌', emoji: '🐝' }, { word: '닭', emoji: '🐔' },
  { word: '고양이', emoji: '🐱' }, { word: '강아지', emoji: '🐶' }, { word: '거북이', emoji: '🐢' }, { word: '원숭이', emoji: '🐒' },
  { word: '호랑이', emoji: '🐯' }, { word: '기린', emoji: '🦒' }, { word: '펭귄', emoji: '🐧' }, { word: '문어', emoji: '🐙' },
  { word: '고래', emoji: '🐋' }, { word: '상어', emoji: '🦈' }, { word: '물고기', emoji: '🐟' }, { word: '돼지', emoji: '🐷' },
  { word: '판다', emoji: '🐼' }, { word: '낙타', emoji: '🐫' }, { word: '개구리', emoji: '🐸' }, { word: '다람쥐', emoji: '🐿️' },
  { word: '달팽이', emoji: '🐌' }, { word: '독수리', emoji: '🦅' }, { word: '돌고래', emoji: '🐬' }, { word: '병아리', emoji: '🐤' },
  { word: '모기', emoji: '🦟' }, { word: '캥거루', emoji: '🦘' }, { word: '표범', emoji: '🐆' }, { word: '오징어', emoji: '🦑' },
  { word: '너구리', emoji: '🦝' }, { word: '부엉이', emoji: '🦉' }, { word: '쥐', emoji: '🐭' }, { word: '게', emoji: '🦀' },
  { word: '공룡', emoji: '🦕' }, { word: '유니콘', emoji: '🦄' }, { word: '애벌레', emoji: '🐛' }, { word: '조개', emoji: '🐚' },
  // 먹을 것
  { word: '포도', emoji: '🍇' }, { word: '우유', emoji: '🥛' }, { word: '치즈', emoji: '🧀' }, { word: '피자', emoji: '🍕' },
  { word: '고기', emoji: '🍖' }, { word: '바나나', emoji: '🍌' }, { word: '토마토', emoji: '🍅' }, { word: '가지', emoji: '🍆' },
  { word: '사과', emoji: '🍎' }, { word: '주스', emoji: '🧃' }, { word: '밥', emoji: '🍚' }, { word: '빵', emoji: '🍞' },
  { word: '귤', emoji: '🍊' }, { word: '꿀', emoji: '🍯' }, { word: '수박', emoji: '🍉' }, { word: '사탕', emoji: '🍬' },
  { word: '딸기', emoji: '🍓' }, { word: '당근', emoji: '🥕' }, { word: '햄버거', emoji: '🍔' }, { word: '옥수수', emoji: '🌽' },
  { word: '케이크', emoji: '🎂' }, { word: '라면', emoji: '🍜' }, { word: '레몬', emoji: '🍋' }, { word: '쿠키', emoji: '🍪' },
  { word: '키위', emoji: '🥝' }, { word: '체리', emoji: '🍒' }, { word: '치킨', emoji: '🍗' }, { word: '초콜릿', emoji: '🍫' },
  { word: '감자', emoji: '🥔' }, { word: '도넛', emoji: '🍩' }, { word: '버섯', emoji: '🍄' }, { word: '오이', emoji: '🥒' },
  { word: '양파', emoji: '🧅' }, { word: '아이스크림', emoji: '🍦' }, { word: '핫도그', emoji: '🌭' }, { word: '호박', emoji: '🎃' },
  { word: '요요', emoji: '🪀' }, { word: '약', emoji: '💊' }, { word: '밤', emoji: '🌰' }, { word: '파인애플', emoji: '🍍' },
  { word: '복숭아', emoji: '🍑' }, { word: '달걀', emoji: '🥚' }, { word: '주먹밥', emoji: '🍙' }, { word: '수프', emoji: '🥣' },
  // 탈것
  { word: '기차', emoji: '🚂' }, { word: '버스', emoji: '🚌' }, { word: '요트', emoji: '⛵' }, { word: '자동차', emoji: '🚗' },
  { word: '비행기', emoji: '✈️' }, { word: '트럭', emoji: '🚚' }, { word: '택시', emoji: '🚕' }, { word: '로켓', emoji: '🚀' },
  { word: '자전거', emoji: '🚲' }, { word: '헬리콥터', emoji: '🚁' }, { word: '소방차', emoji: '🚒' }, { word: '구급차', emoji: '🚑' },
  { word: '경찰차', emoji: '🚓' }, { word: '배', emoji: '🚢' }, { word: '오토바이', emoji: '🏍️' }, { word: '스쿠터', emoji: '🛴' },
  // 물건
  { word: '모자', emoji: '🧢' }, { word: '라디오', emoji: '📻' }, { word: '드럼', emoji: '🥁' }, { word: '시계', emoji: '⏰' },
  { word: '구두', emoji: '👞' }, { word: '로봇', emoji: '🤖' }, { word: '책', emoji: '📚' }, { word: '공', emoji: '⚽' },
  { word: '돈', emoji: '💰' }, { word: '종', emoji: '🔔' }, { word: '컵', emoji: '🥤' }, { word: '연필', emoji: '✏️' },
  { word: '우산', emoji: '☂️' }, { word: '선물', emoji: '🎁' }, { word: '풍선', emoji: '🎈' }, { word: '리본', emoji: '🎀' },
  { word: '카메라', emoji: '📷' }, { word: '피아노', emoji: '🎹' }, { word: '편지', emoji: '✉️' }, { word: '포크', emoji: '🍴' },
  { word: '하트', emoji: '❤️' }, { word: '장갑', emoji: '🧤' }, { word: '지도', emoji: '🗺️' }, { word: '망치', emoji: '🔨' },
  { word: '목도리', emoji: '🧣' }, { word: '바지', emoji: '👖' }, { word: '신발', emoji: '👟' }, { word: '숟가락', emoji: '🥄' },
  { word: '안경', emoji: '👓' }, { word: '의자', emoji: '🪑' }, { word: '인형', emoji: '🧸' }, { word: '바이올린', emoji: '🎻' },
  { word: '벽돌', emoji: '🧱' }, { word: '크레파스', emoji: '🖍️' }, { word: '휴지', emoji: '🧻' }, { word: '노트북', emoji: '💻' },
  { word: '텐트', emoji: '⛺' }, { word: '가방', emoji: '🎒' }, { word: '열쇠', emoji: '🔑' }, { word: '가위', emoji: '✂️' },
  { word: '양말', emoji: '🧦' }, { word: '치마', emoji: '👗' }, { word: '그림', emoji: '🖼️' }, { word: '전화기', emoji: '📞' },
  { word: '마스크', emoji: '😷' }, { word: '촛불', emoji: '🕯️' }, { word: '왕관', emoji: '👑' }, { word: '기타', emoji: '🎸' },
  // 자연·몸·놀이
  { word: '나무', emoji: '🌳' }, { word: '바다', emoji: '🌊' }, { word: '달', emoji: '🌙' }, { word: '별', emoji: '⭐' },
  { word: '물', emoji: '💧' }, { word: '불', emoji: '🔥' }, { word: '눈사람', emoji: '⛄' }, { word: '집', emoji: '🏠' },
  { word: '문', emoji: '🚪' }, { word: '산', emoji: '⛰️' }, { word: '손', emoji: '✋' }, { word: '발', emoji: '🦶' },
  { word: '아기', emoji: '👶' }, { word: '유령', emoji: '👻' }, { word: '야구', emoji: '⚾' }, { word: '해', emoji: '☀️' },
  { word: '구름', emoji: '☁️' }, { word: '무지개', emoji: '🌈' }, { word: '지구', emoji: '🌍' }, { word: '해바라기', emoji: '🌻' },
  { word: '튤립', emoji: '🌷' }, { word: '꽃', emoji: '🌸' }, { word: '야자수', emoji: '🌴' }, { word: '얼음', emoji: '🧊' },
  { word: '코', emoji: '👃' }, { word: '귀', emoji: '👂' }, { word: '눈', emoji: '👀' }, { word: '이', emoji: '🦷' },
  { word: '스키', emoji: '⛷️' }, { word: '탁구', emoji: '🏓' }, { word: '교회', emoji: '⛪' }, { word: '요정', emoji: '🧚' },
  { word: '경찰', emoji: '👮' }, { word: '섬', emoji: '🏝️' }, { word: '탑', emoji: '🗼' }, { word: '번개', emoji: '⚡' },
  { word: '화산', emoji: '🌋' }, { word: '선인장', emoji: '🌵' }, { word: '샤워', emoji: '🚿' }, { word: '사다리', emoji: '🪜' },
];

/** 기본 자음 14개 / 모음 10개 */
const BASIC_C = new Set(CONSONANTS.map((c) => c.j));
const BASIC_V = new Set(VOWELS.map((v) => v.j));

const groupBy = (pick: (w: string) => string, allowed: Set<string>) => {
  const out: Record<string, string[]> = {};
  for (const { word } of WORDS) {
    const k = pick(word);
    if (allowed.has(k)) (out[k] ??= []).push(word);
  }
  return out;
};

/** 첫소리 자음 문제용: 첫 글자의 자음이 기본 자음인 낱말 (ㄲ·ㅃ처럼 된소리로 시작하는 건 뺀다) */
export const FIRST_SOUND: Record<string, string[]> = groupBy((w) => decompose(w[0]).cho, BASIC_C);

/** 첫 글자 모음 문제용: 첫 글자의 모음이 기본 모음인 낱말 (ㅐ·ㅘ 같은 건 뺀다) */
export const FIRST_VOWEL: Record<string, string[]> = groupBy((w) => decompose(w[0]).jung, BASIC_V);

/** 문장 하늘: 그림 + 문장. blank는 빈칸으로 낼 어절 */
export interface Sentence {
  emoji: string;
  words: string[];
  blank: number;
  /** 빈칸 오답 보기 — 그림을 보면 분명히 틀린 것만 */
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
  { emoji: '🐔🥚', words: ['닭이', '알을', '낳아요'], blank: 1, wrong: ['공을', '책을', '꽃을'] },
  { emoji: '🐝🌻', words: ['벌이', '꽃에', '앉아요'], blank: 0, wrong: ['곰이', '기차가', '고래가'] },
  { emoji: '🚒🔥', words: ['소방차가', '불을', '꺼요'], blank: 1, wrong: ['밥을', '꽃을', '우유를'] },
  { emoji: '🧒🪥', words: ['나는', '이를', '닦아요'], blank: 2, wrong: ['날아요', '마셔요', '짖어요'] },
  { emoji: '🐶🦴', words: ['강아지가', '멍멍', '짖어요'], blank: 2, wrong: ['날아요', '헤엄쳐요', '읽어요'] },
  { emoji: '🐒🍌', words: ['원숭이가', '바나나를', '먹어요'], blank: 1, wrong: ['당근을', '우유를', '꿀을'] },
  { emoji: '✈️☁️', words: ['비행기가', '하늘을', '날아요'], blank: 0, wrong: ['기차가', '배가', '버스가'] },
  { emoji: '🚂🛤️', words: ['기차가', '칙칙폭폭', '달려요'], blank: 0, wrong: ['비행기가', '배가', '물고기가'] },
  { emoji: '🧒🎨', words: ['나는', '그림을', '그려요'], blank: 1, wrong: ['밥을', '우유를', '공을'] },
  { emoji: '🐸🌧️', words: ['개구리가', '개굴개굴', '울어요'], blank: 1, wrong: ['멍멍', '음매', '꼬끼오'] },
  { emoji: '🐓🌅', words: ['닭이', '꼬끼오', '울어요'], blank: 1, wrong: ['멍멍', '야옹', '음매'] },
  { emoji: '🐱🧶', words: ['고양이가', '야옹', '울어요'], blank: 1, wrong: ['멍멍', '꼬끼오', '음매'] },
  { emoji: '🐮🌾', words: ['소가', '음매', '울어요'], blank: 1, wrong: ['야옹', '꼬끼오', '개굴개굴'] },
  { emoji: '🦁🌳', words: ['사자가', '어흥', '울어요'], blank: 1, wrong: ['멍멍', '야옹', '꼬끼오'] },
  { emoji: '🌙⭐', words: ['밤하늘에', '별이', '반짝여요'], blank: 1, wrong: ['해가', '비가', '꽃이'] },
  { emoji: '⛄❄️', words: ['하얀', '눈이', '펑펑', '와요'], blank: 1, wrong: ['해가', '꽃이', '달이'] },
  { emoji: '🧒🚲', words: ['나는', '자전거를', '타요'], blank: 1, wrong: ['우유를', '책을', '사과를'] },
  { emoji: '🎣🐟', words: ['아빠가', '물고기를', '잡아요'], blank: 1, wrong: ['구름을', '달을', '집을'] },
  { emoji: '🐧❄️', words: ['펭귄이', '얼음 위를', '걸어요'], blank: 2, wrong: ['날아요', '마셔요', '읽어요'] },
  { emoji: '🐿️🌰', words: ['다람쥐가', '밤을', '모아요'], blank: 1, wrong: ['우유를', '자동차를', '구름을'] },
  { emoji: '🧒🍦', words: ['나는', '아이스크림을', '먹어요'], blank: 1, wrong: ['신발을', '연필을', '의자를'] },
  { emoji: '🐌🌿', words: ['달팽이가', '느릿느릿', '기어가요'], blank: 0, wrong: ['비행기가', '로켓이', '토끼가'] },
  { emoji: '🎂🕯️', words: ['생일', '케이크에', '촛불을', '켜요'], blank: 2, wrong: ['우산을', '양말을', '물고기를'] },
  { emoji: '🧒🎈', words: ['풍선이', '하늘로', '둥실', '떠가요'], blank: 0, wrong: ['돌이', '의자가', '집이'] },
];

export const wordByText = (w: string) => WORDS.find((x) => x.word === w)!;
