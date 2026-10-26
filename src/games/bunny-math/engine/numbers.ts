/**
 * 아이에게 읽어 줄 수 말.
 * 물건을 셀 때는 고유어(하나, 둘 / 한 개, 두 개), 식을 읽을 때는 한자어(삼 더하기 이는 오).
 * 화면 글자는 숫자(3), 소리는 말(셋) — 기기 음성이 "3개"를 "삼 개"로 읽지 않도록.
 */
const NATIVE = ['영', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
const SINO = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'];

/** 하나, 둘, … 열, 열하나, … 스물 */
export function native(n: number): string {
  if (n <= 10) return NATIVE[n];
  if (n < 20) return '열' + NATIVE[n - 10];
  if (n === 20) return '스물';
  if (n < 30) return '스물' + NATIVE[n - 20];
  return sino(n);
}

/** 수 꾸밈말: 한, 두, 세, 네, … 열한, 스무 */
export function nativeAdj(n: number): string {
  const w = native(n);
  if (n === 20) return '스무';
  return w.replace(/하나$/, '한').replace(/둘$/, '두').replace(/셋$/, '세').replace(/넷$/, '네');
}

/** 한 개, 두 개, 세 개 */
export const pieces = (n: number, unit = '개') => `${nativeAdj(n)} ${unit}`;

/** 일, 이, 삼 … 십, 십일 … 이십 */
export function sino(n: number): string {
  if (n <= 10) return SINO[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return (tens > 1 ? SINO[tens] : '') + '십' + (ones ? SINO[ones] : '');
}

/** 3 + 2 → "삼 더하기 이" */
export const sayExpr = (a: number, op: '+' | '-', b: number | '?') => `${sino(a as number)} ${op === '+' ? '더하기' : '빼기'} ${b === '?' ? '몇' : sino(b)}`;
