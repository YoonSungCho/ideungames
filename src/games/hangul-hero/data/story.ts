/**
 * 이야기 장면 대본. {name}은 설정의 아이 이름(용사), {call}은 "이든아" 같은 부르는 말.
 * speaker: hero(용사) | bot(띠봇) | dwijuk(뒤죽) | bakjuk(박죽) | narrator(해설)
 */
export type Speaker = 'hero' | 'bot' | 'dwijuk' | 'bakjuk' | 'narrator';
export interface Line {
  speaker: Speaker;
  text: string;
}

export const PROLOGUE: Line[] = [
  { speaker: 'narrator', text: '세종 임금님이 만든 한글이 반짝반짝 빛나는 한글 나라.' },
  { speaker: 'dwijuk', text: '흥! 글자들이 너무 줄 맞춰 서 있어서 재미없어!' },
  { speaker: 'bakjuk', text: '다 뒤죽박죽으로 섞어 버리자! 회오리 바람이다~!' },
  { speaker: 'narrator', text: '쌍둥이 마왕 뒤죽과 박죽이 글자를 산산조각 내자, 한글 나라가 회색으로 변해 버렸어요.' },
  { speaker: 'bot', text: '띠리릭! 하늘에서 한글 붓이 떨어졌어요. 붓을 주운 건… {name}!' },
  { speaker: 'bot', text: '{call}, 흩어진 글자 조각을 모아서 한글 나라를 구해 줘!' },
  { speaker: 'hero', text: '좋아! 한글 용사 {name}, 출동!' },
];

export const REGION_INTRO: Record<string, Line[]> = {
  consonant: [
    { speaker: 'bot', text: '여기는 자음 마을이야. ㄱ, ㄴ, ㄷ… 자음 친구들이 풀숲에 숨어 버렸어!' },
    { speaker: 'dwijuk', text: '킥킥, 이름을 불러도 못 찾을걸?' },
    { speaker: 'hero', text: '내가 다 찾아낼 거야!' },
  ],
  vowel: [
    { speaker: 'bot', text: '모음 바다에 도착! 박죽이 ㅏ, ㅓ, ㅗ, ㅜ를 파도에 흩뿌렸어.' },
    { speaker: 'bakjuk', text: '아? 어? 오? 우? 헷갈리지롱~' },
    { speaker: 'hero', text: '귀를 쫑긋! 잘 듣고 찾을게!' },
  ],
  castle: [
    { speaker: 'bot', text: '글자 성의 벽돌 글자들이 자음과 모음으로 쪼개졌어!' },
    { speaker: 'dwijuk', text: 'ㄱ이랑 ㅏ를 다시 붙일 수 있을까?' },
    { speaker: 'hero', text: '자음이랑 모음을 합치면 글자가 되지! 다시 지을게!' },
  ],
  cave: [
    { speaker: 'bot', text: '어두운 받침 동굴… 글자들의 받침이 뚝 떨어져 굴러다녀.' },
    { speaker: 'bakjuk', text: '"달"이 "다"가 됐다! 크크큭.' },
    { speaker: 'hero', text: '받침을 제자리에 끼워 줄게!' },
  ],
  forest: [
    { speaker: 'bot', text: '낱말 숲의 나무 이름표가 뒤죽박죽 섞였어!' },
    { speaker: 'dwijuk', text: '사과가 사자고, 사자가 사과다~!' },
    { speaker: 'hero', text: '그림을 잘 보면 진짜 이름을 알 수 있어!' },
  ],
  sky: [
    { speaker: 'bot', text: '드디어 문장 하늘! 저 위 구름성에 뒤죽과 박죽이 있어.' },
    { speaker: 'bakjuk', text: '낱말은 찾았어도 문장은 못 만들걸?' },
    { speaker: 'dwijuk', text: '여기가 마지막이다, 꼬마 용사!' },
    { speaker: 'hero', text: '지금까지 모은 글자로 문장을 완성할 거야!' },
  ],
};

export const BOSS_INTRO: Record<string, Line[]> = {
  consonant: [{ speaker: 'dwijuk', text: '여기까지 오다니! 내 자음 회오리를 받아라!' }, { speaker: 'bot', text: '맞힐 때마다 붓에서 빛이 나가! 빨리 맞히면 더 세게!' }],
  vowel: [{ speaker: 'bakjuk', text: '파도처럼 출렁출렁~ 모음을 다 섞어 주마!' }, { speaker: 'hero', text: '잘 듣고 정확하게!' }],
  castle: [{ speaker: 'dwijuk', text: '성벽을 와르르 무너뜨려 주지!' }, { speaker: 'hero', text: '한 글자씩 다시 쌓을 거야!' }],
  cave: [{ speaker: 'bakjuk', text: '받침은 전부 내 거야! 동굴 깊이 숨겨 버릴 테다!' }, { speaker: 'hero', text: '받침아, 돌아와!' }],
  forest: [{ speaker: 'dwijuk', text: '이름표를 몽땅 바꿔 붙이겠다!' }, { speaker: 'hero', text: '그림을 보면 다 알 수 있어!' }],
  sky: [{ speaker: 'dwijuk', text: '둘이 함께라면 최강이다!' }, { speaker: 'bakjuk', text: '최강 회오리~!' }, { speaker: 'hero', text: '한글 붓아, 힘을 줘!' }],
};

export const BOSS_WIN: Record<string, Line[]> = {
  consonant: [{ speaker: 'dwijuk', text: '으아악! 자음들이 다시 반짝인다!' }, { speaker: 'bot', text: '자음 마을에 색이 돌아왔어! {call}, 최고야!' }],
  vowel: [{ speaker: 'bakjuk', text: '으앙, 파도가 잔잔해졌어…' }, { speaker: 'bot', text: '모음 바다가 다시 파래졌어!' }],
  castle: [{ speaker: 'dwijuk', text: '성이… 다시 튼튼해졌잖아!' }, { speaker: 'bot', text: '글자 성 완성! 대단해!' }],
  cave: [{ speaker: 'bakjuk', text: '받침들이 다 도망가 버렸어!' }, { speaker: 'bot', text: '동굴 안에 보석처럼 받침이 빛나!' }],
  forest: [{ speaker: 'dwijuk', text: '이름표가 다 제자리로 갔어…' }, { speaker: 'bot', text: '낱말 숲이 다시 푸르러졌어!' }],
  sky: [],
};

export const ENDING: Line[] = [
  { speaker: 'narrator', text: '구름성 꼭대기에서 뒤죽과 박죽이 마지막 회오리를 일으켰어요.' },
  { speaker: 'hero', text: '모은 글자로 문장을 쓸게! "우리 사이좋게 지내자!"' },
  { speaker: 'narrator', text: '문장이 무지개처럼 빛나자 회오리가 스르르 멈췄어요.' },
  { speaker: 'dwijuk', text: '흑흑… 사실 우린 글을 몰라서 심술이 났던 거야.' },
  { speaker: 'bakjuk', text: '우리도 글을 읽고 싶었어…' },
  { speaker: 'hero', text: '그럼 나랑 같이 배우자! 한글은 누구나 쉽게 배울 수 있어!' },
  { speaker: 'bot', text: '한글 나라가 무지개색으로 빛나! {call}, 진짜 한글 용사야!' },
];

export const SPEAKER_NAME: Record<Speaker, string> = { hero: '{name}', bot: '띠봇', dwijuk: '뒤죽', bakjuk: '박죽', narrator: '' };
