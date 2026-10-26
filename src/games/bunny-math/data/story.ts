import type { FriendId } from './items';

export type Speaker = FriendId | 'narrator';
/** {call}: "이서야", {name}: "이서" */
export interface StoryLine {
  who: Speaker;
  text: string;
}

export const PROLOGUE: StoryLine[] = [
  { who: 'narrator', text: '깡충 숲에는 숫자를 좋아하는 토끼 토리가 살아요.' },
  { who: 'tori', text: '안녕, {call}! 나는 토리야. 보름달이 뜨는 밤에 숲속 친구들을 불러서 큰 잔치를 열 거야!' },
  { who: 'tori', text: '그런데 당근도 세야 하고, 친구들 선물도 나눠야 하고… 나 혼자서는 너무 어려워.' },
  { who: 'tori', text: '{call}, 나랑 같이 세고 더해 줄래? 친구들을 도와주면 잔치에 꼭 와 줄 거야. 가 보자, 깡충!' },
];

/** 단원에 처음 들어갈 때 */
export const CHAPTER_INTRO: Record<string, StoryLine[]> = {
  field: [
    { who: 'tori', text: '여기는 내 당근밭이야. 잔치에 쓸 당근을 캐야 해!' },
    { who: 'tori', text: '당근을 하나씩 손가락으로 콕콕 누르면서 같이 세어 보자. 하나, 둘, 셋!' },
  ],
  acorn: [
    { who: 'squirrel', text: '안녕! 나는 다람쥐 알밤이야. 겨울에 먹을 도토리를 모으는 중이야.' },
    { who: 'squirrel', text: '그런데 도토리가 많아지니까 자꾸 헷갈려. 열까지 같이 세어 줄래?' },
  ],
  stream: [
    { who: 'frog', text: '개굴! 나는 퐁당이야. 이 냇물에는 숫자가 적힌 징검다리가 있어.' },
    { who: 'frog', text: '돌 하나를 건널 때마다 한 칸이야. 깡충, 하나! 깡충, 둘! 몇 칸 뛰었는지 세어 봐.' },
  ],
  flower: [
    { who: 'bee', text: '윙윙! 나는 꿀벌 윙윙이야. 꽃밭에서 꿀을 모으고 있어.' },
    { who: 'bee', text: '하나를 더 받으면 앞으로 한 칸, 하나를 주면 뒤로 한 칸! 징검다리랑 똑같아.' },
  ],
  shop: [
    { who: 'bear', text: '어서 와! 곰 아저씨 과일가게란다. 잔치에 쓸 과일을 더 줄게.' },
    { who: 'bear', text: '과일을 받을 때마다 토리가 앞으로 한 칸씩 깡충! 그럼 모두 몇 개인지 알 수 있지.' },
  ],
  cheese: [
    { who: 'mouse', text: '찍찍! 나는 생쥐 쪼르야. 치즈를 조금만 나눠 줄 수 있어?' },
    { who: 'mouse', text: '하나 줄 때마다 토리가 뒤로 한 칸씩! 남은 건 몇 개일까?' },
  ],
  nest: [
    { who: 'duck', text: '꽥꽥! 나는 오리 뒤뚱이야. 알 상자에는 딱 열 칸이 있어.' },
    { who: 'duck', text: '열 칸을 꽉 채우려면 몇 개가 더 필요할까? 같이 맞혀 보자!' },
  ],
  train: [
    { who: 'raccoon', text: '칙칙폭폭! 너구리 기관사란다. 기차 한 칸에는 열 개씩 실을 수 있어.' },
    { who: 'raccoon', text: '열 개짜리 한 칸하고 몇 개가 더 있으면 열하나, 열둘… 스물까지 가 보자!' },
  ],
  hill: [
    { who: 'owl', text: '부엉부엉. 나는 별빛 언덕의 부엉 박사란다.' },
    { who: 'owl', text: '이제는 물건 없이 식만 보고도 계산할 수 있겠니? 헷갈리면 토리를 뛰게 해 보렴.' },
  ],
};

/** 단원을 다 깼을 때: 친구가 잔치에 오기로 한다 */
export const CHAPTER_DONE: Record<string, StoryLine[]> = {
  field: [{ who: 'tori', text: '당근을 다 셌어! {call}, 정말 잘 센다. 이제 숲속 친구들을 만나러 가자!' }],
  acorn: [{ who: 'squirrel', text: '도토리를 다 셌어! 고마워, {call}. 잔치에 도토리 쿠키를 가지고 갈게!' }],
  stream: [{ who: 'frog', text: '깡충깡충 최고야! 잔치에서 개굴개굴 노래를 불러 줄게!' }],
  flower: [{ who: 'bee', text: '하나 더, 하나 덜! 다 알았구나. 잔치에 달콤한 꿀을 가져갈게!' }],
  shop: [{ who: 'bear', text: '더하기 박사로구나! 잔치에 과일 바구니를 한가득 보내 주마.' }],
  cheese: [{ who: 'mouse', text: '나눠 줘서 고마워! 잔치에 치즈 케이크를 구워 갈게!' }],
  nest: [{ who: 'duck', text: '열 칸이 꽉 찼어! 잔치에서 뒤뚱뒤뚱 춤을 출게!' }],
  train: [{ who: 'raccoon', text: '스물까지 척척이구나! 잔치 날에 친구들을 기차로 태워 오마.' }],
  hill: [{ who: 'owl', text: '훌륭하구나, {call}. 이제 너는 숲속 계산 박사란다. 보름달이 떴어, 잔치에 가자!' }],
};

export const ENDING: StoryLine[] = [
  { who: 'narrator', text: '보름달이 환하게 뜬 밤, 깡충 숲에 친구들이 모두 모였어요.' },
  { who: 'tori', text: '{call}, 네 덕분에 잔치 준비를 다 했어! 당근도, 과일도, 치즈도 딱 맞아!' },
  { who: 'owl', text: '세고, 뛰고, 더하고, 빼고… 정말 멋지게 해냈구나.' },
  { who: 'tori', text: '앞으로도 같이 놀자! 섞어 놀기에서 언제든 기다릴게. 고마워, {call}!' },
];
