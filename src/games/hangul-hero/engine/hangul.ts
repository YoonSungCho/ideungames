/** 유니코드 한글 음절 조합·분해 (가 = U+AC00) */
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export function compose(cho: string, jung: string, jong = ''): string {
  const c = CHO.indexOf(cho);
  const j = JUNG.indexOf(jung);
  const k = JONG.indexOf(jong);
  if (c < 0 || j < 0 || k < 0) throw new Error(`조합할 수 없음: ${cho}${jung}${jong}`);
  return String.fromCharCode(0xac00 + (c * 21 + j) * 28 + k);
}

export function decompose(syllable: string): { cho: string; jung: string; jong: string } {
  const code = syllable.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) throw new Error(`한글 음절이 아님: ${syllable}`);
  return { cho: CHO[Math.floor(code / 588)], jung: JUNG[Math.floor((code % 588) / 28)], jong: JONG[code % 28] };
}

export const hasBatchim = (syllable: string) => decompose(syllable).jong !== '';

/** 기본 자음 14자 — 이름과 읽는 소리 */
export const CONSONANTS = [
  { j: 'ㄱ', name: '기역' },
  { j: 'ㄴ', name: '니은' },
  { j: 'ㄷ', name: '디귿' },
  { j: 'ㄹ', name: '리을' },
  { j: 'ㅁ', name: '미음' },
  { j: 'ㅂ', name: '비읍' },
  { j: 'ㅅ', name: '시옷' },
  { j: 'ㅇ', name: '이응' },
  { j: 'ㅈ', name: '지읒' },
  { j: 'ㅊ', name: '치읓' },
  { j: 'ㅋ', name: '키읔' },
  { j: 'ㅌ', name: '티읕' },
  { j: 'ㅍ', name: '피읖' },
  { j: 'ㅎ', name: '히읗' },
] as const;

/** 기본 모음 10자 — 소리는 ㅇ을 붙여 읽는다 (ㅏ → 아) */
export const VOWELS = [
  { j: 'ㅏ', say: '아' },
  { j: 'ㅑ', say: '야' },
  { j: 'ㅓ', say: '어' },
  { j: 'ㅕ', say: '여' },
  { j: 'ㅗ', say: '오' },
  { j: 'ㅛ', say: '요' },
  { j: 'ㅜ', say: '우' },
  { j: 'ㅠ', say: '유' },
  { j: 'ㅡ', say: '으' },
  { j: 'ㅣ', say: '이' },
] as const;

export const consonantName = (j: string) => CONSONANTS.find((c) => c.j === j)?.name ?? j;
export const vowelSay = (j: string) => VOWELS.find((v) => v.j === j)?.say ?? j;
/** 자모를 소리로 읽을 때 쓸 말 */
export const jamoSay = (j: string) => CONSONANTS.find((c) => c.j === j)?.name ?? VOWELS.find((v) => v.j === j)?.say ?? j;

/** 헷갈리기 쉬운 짝 (오답 보기로 쓰면 좋은 것들) */
export const LOOKALIKE: Record<string, string[]> = {
  ㄱ: ['ㅋ', 'ㄴ'], ㅋ: ['ㄱ', 'ㅌ'], ㄴ: ['ㄷ', 'ㄱ'], ㄷ: ['ㅌ', 'ㄴ'], ㅌ: ['ㄷ', 'ㅋ'], ㄹ: ['ㄷ', 'ㅌ'],
  ㅁ: ['ㅂ', 'ㅇ'], ㅂ: ['ㅍ', 'ㅁ'], ㅍ: ['ㅂ', 'ㅌ'], ㅅ: ['ㅈ', 'ㅊ'], ㅈ: ['ㅊ', 'ㅅ'], ㅊ: ['ㅈ', 'ㅎ'], ㅇ: ['ㅎ', 'ㅁ'], ㅎ: ['ㅇ', 'ㅊ'],
  ㅏ: ['ㅓ', 'ㅑ'], ㅓ: ['ㅏ', 'ㅕ'], ㅑ: ['ㅕ', 'ㅏ'], ㅕ: ['ㅑ', 'ㅓ'], ㅗ: ['ㅜ', 'ㅛ'], ㅜ: ['ㅗ', 'ㅠ'], ㅛ: ['ㅠ', 'ㅗ'], ㅠ: ['ㅛ', 'ㅜ'], ㅡ: ['ㅣ', 'ㅜ'], ㅣ: ['ㅡ', 'ㅏ'],
};
