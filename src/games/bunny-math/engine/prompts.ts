import { FRIENDS, ITEMS } from '../data/items';
import { josa } from '@/shared/korean';
import { nativeAdj, pieces, sayExpr, sino } from './numbers';
import { answerOf, resultOf } from './tasks';
import type { Task } from './types';

/** 화면 글(숫자)과 읽어 줄 말(셋, 세 개)을 따로 둔다 */
export interface Line {
  text: string;
  say: string;
}

export type Phase = 'act' | 'answer';

const line = (text: string, say = text): Line => ({ text, say });
const item = (t: { item: keyof typeof ITEMS }) => ITEMS[t.item].name;
const who = (id: keyof typeof FRIENDS) => FRIENDS[id].call;
const steps = (k: number) => `${nativeAdj(k)} 칸`;
const topic = (w: string) => josa(w, '은/는');

/** 처음 하는 일: 물건을 누르거나 토리를 뛰게 하는 단계가 있으면 'act' */
export function firstPhase(t: Task): Phase {
  if (t.kind === 'count') return t.tap ? 'act' : 'answer';
  return t.kind === 'make' || t.kind === 'hop' || t.kind === 'story' || t.kind === 'ten' ? 'act' : 'answer';
}

/** 문제 말 */
export function promptOf(t: Task, phase: Phase): Line {
  switch (t.kind) {
    case 'count': {
      const it = item(t);
      if (phase === 'act') return line(`${josa(it, '을/를')} 하나씩 눌러서 세어 봐!`);
      if (t.tap) return line(`${josa(it, '은/는')} 모두 몇 개야?`);
      if (t.layout === 'frame') return line(`상자 한 줄에 10개씩! ${josa(it, '은/는')} 모두 몇 개일까?`, `상자 한 줄에 열 개씩! ${josa(it, '은/는')} 모두 몇 개일까?`);
      return line(`${josa(it, '이/가')} 몇 개 있을까?`);
    }
    case 'make': {
      const it = item(t);
      return line(`바구니에 ${it} ${t.n}개를 담아 줘!`, `바구니에 ${it} ${pieces(t.n)}를 담아 줘!`);
    }
    case 'compare': {
      if (!t.item) return t.ask === 'more' ? line('어느 수가 더 클까?') : line('어느 수가 더 작을까?');
      const it = ITEMS[t.item].name;
      return t.ask === 'more' ? line(`누가 ${josa(it, '을/를')} 더 많이 가졌을까?`) : line(`누가 ${josa(it, '을/를')} 더 적게 가졌을까?`);
    }
    case 'hop': {
      const way = t.dir === 1 ? '앞으로' : '뒤로';
      return line(`토리는 ${t.from}에 있어. ${way} ${t.k}칸 깡충깡충 뛰어 볼까?`, `토리는 ${sino(t.from)}에 있어. ${way} ${steps(t.k)} 깡충깡충 뛰어 볼까?`);
    }
    case 'land': {
      const way = t.dir === 1 ? '앞으로' : '뒤로';
      return line(`토리가 ${t.from}에서 ${way} ${t.k}칸 뛰면 어디에 도착할까? 돌을 눌러 봐!`, `토리가 ${sino(t.from)}에서 ${way} ${steps(t.k)} 뛰면 어디에 도착할까? 돌을 눌러 봐!`);
    }
    case 'story': {
      const it = item(t);
      const w = who(t.who);
      if (t.op === '+') {
        if (phase === 'act') {
          return line(
            `토리는 ${it} ${t.a}개가 있어. ${josa(w, '이/가')} ${t.b}개를 더 줬어! 선물을 눌러서 바구니에 넣어 봐.`,
            `토리는 ${it} ${pieces(t.a)}가 있어. ${josa(w, '이/가')} ${pieces(t.b)}를 더 줬어! 선물을 눌러서 바구니에 넣어 봐.`,
          );
        }
        return line(`이제 ${josa(it, '은/는')} 모두 몇 개야?`);
      }
      if (phase === 'act') {
        return line(
          `토리는 ${it} ${t.a}개가 있어. ${w}에게 ${t.b}개를 나눠 줄 거야. 줄 ${josa(it, '을/를')} 눌러 봐!`,
          `토리는 ${it} ${pieces(t.a)}가 있어. ${w}에게 ${pieces(t.b)}를 나눠 줄 거야. 줄 ${josa(it, '을/를')} 눌러 봐!`,
        );
      }
      return line(`토리한테 남은 ${josa(it, '은/는')} 몇 개야?`);
    }
    case 'calc': {
      if (t.words) {
        const it = ITEMS[t.words.item].name;
        const w = who(t.words.who);
        const total = resultOf(t);
        if (t.missing) {
          return line(
            `토리는 ${it} ${t.a}개가 있었어. ${josa(w, '이/가')} 더 줘서 ${total}개가 됐어. ${josa(w, '이/가')} 몇 개를 줬을까?`,
            `토리는 ${it} ${pieces(t.a)}가 있었어. ${josa(w, '이/가')} 더 줘서 ${pieces(total)}가 됐어. ${josa(w, '이/가')} 몇 개를 줬을까?`,
          );
        }
        if (t.op === '+') {
          return line(
            `토리는 ${it} ${t.a}개가 있었어. ${josa(w, '이/가')} ${t.b}개를 더 줬어. 모두 몇 개일까?`,
            `토리는 ${it} ${pieces(t.a)}가 있었어. ${josa(w, '이/가')} ${pieces(t.b)}를 더 줬어. 모두 몇 개일까?`,
          );
        }
        return line(
          `토리는 ${it} ${t.a}개가 있었어. ${w}에게 ${t.b}개를 줬어. 몇 개가 남았을까?`,
          `토리는 ${it} ${pieces(t.a)}가 있었어. ${w}에게 ${pieces(t.b)}를 줬어. 몇 개가 남았을까?`,
        );
      }
      if (t.missing) return line('토리가 🚩까지 가려면 몇 칸 뛰어야 할까?', `${sayExpr(t.a, '+', '?')}이 ${sino(resultOf(t))}일까? 토리가 깃발까지 몇 칸 뛰어야 할까?`);
      return line('얼마일까? 토리를 깡충 뛰게 해서 세어 봐도 돼!', `${topic(sayExpr(t.a, t.op, t.b))} 얼마일까?`);
    }
    case 'ten':
      if (phase === 'act') return line('알 상자 10칸을 꽉 채워 볼까? 빈칸을 눌러 봐!', '알 상자 열 칸을 꽉 채워 볼까? 빈칸을 눌러 봐!');
      return line('알을 몇 개 더 넣었지?');
  }
}

/** 한 번 틀렸을 때: 혼내지 않고 어떻게 생각하면 되는지 */
export function hintOf(t: Task, extra?: { count?: number }): Line {
  switch (t.kind) {
    case 'count':
      return t.tap ? line('마지막에 센 수가 모두야! 다시 볼까?') : line('하나씩 눌러서 세어 봐!');
    case 'make': {
      const c = extra?.count ?? 0;
      return line(`지금 바구니에 ${c}개 있어. ${t.n}개만 담아 볼까?`, `지금 바구니에 ${pieces(c)} 있어. ${pieces(t.n)}만 담아 볼까?`);
    }
    case 'compare':
      return t.item ? line('하나씩 짝을 지어 보면 남는 쪽이 더 많아!') : line('수 길에서 오른쪽에 있을수록 큰 수야!');
    case 'hop':
      return t.dir === 1 ? line('앞으로는 오른쪽이야. 한 칸씩 깡충!') : line('뒤로는 왼쪽이야. 한 칸씩 깡충!');
    case 'land':
      return line('토리랑 같이 한 칸씩 세어 볼까? 깡충, 하나!');
    case 'story':
      return line('토리가 서 있는 돌의 수를 봐!');
    case 'calc':
      return t.missing ? line('토리를 깃발까지 뛰게 하고, 몇 번 뛰었는지 세어 봐!') : line('토리를 깡충깡충 뛰게 해서 세어 봐!');
    case 'ten':
      return line('넣은 알을 하나씩 세어 봐!');
  }
}

/** 두 번 틀리면 정답을 보여 주고 말로도 알려 준다. 그래도 아이가 직접 눌러야 넘어간다 */
export function revealOf(t: Task): Line {
  const a = answerOf(t);
  switch (t.kind) {
    case 'make':
      return line(`${t.n}개면 돼! 하나씩 세면서 담아 봐.`, `${pieces(t.n)}면 돼! 하나씩 세면서 담아 봐.`);
    case 'compare':
      return line('초록색 쪽이야! 눌러 볼까?');
    case 'hop':
      return line(`${a}까지 깡충깡충! 반짝이는 돌까지 가 봐.`, `${sino(a)}까지 깡충깡충! 반짝이는 돌까지 가 봐.`);
    case 'land':
      return line(`${a}에 도착해! 반짝이는 돌을 눌러 봐.`, `${sino(a)}에 도착해! 반짝이는 돌을 눌러 봐.`);
    case 'count':
    case 'story':
    case 'ten':
      return line(`정답은 ${a}! 초록색을 눌러 볼까?`, `정답은 ${pieces(a)}! 초록색을 눌러 볼까?`);
    case 'calc':
      return line(`정답은 ${a}! 초록색을 눌러 볼까?`, `정답은 ${sino(a)}! 초록색을 눌러 볼까?`);
  }
}

/** 맞혔을 때 짧게 (글자로만 — 소리는 효과음) */
export const CHEERS = ['잘했어!', '맞았어!', '최고야!', '대단해!', '멋져!'];

/**
 * 맞힌 뒤 한 번 더 이어 주는 말 — 수량과 수 길이 같은 것임을 묶어 준다.
 * (예: "3에서 2칸 가면 5! 당근도 5개야")
 */
export function explainOf(t: Task): Line | null {
  if (t.kind === 'story') {
    const r = resultOf(t);
    const way = t.op === '+' ? '앞으로' : '뒤로';
    return line(`${t.a} ${t.op} ${t.b} = ${r}. ${way} ${t.b}칸 뛰니까 ${r}!`, `${topic(sayExpr(t.a, t.op, t.b))} ${sino(r)}. ${way} ${steps(t.b)} 뛰니까 ${sino(r)}!`);
  }
  if (t.kind === 'hop') {
    const r = answerOf(t);
    return line(`${t.from}에서 ${t.k}칸 ${t.dir === 1 ? '앞으로' : '뒤로'} 가면 ${r}!`, `${sino(t.from)}에서 ${steps(t.k)} ${t.dir === 1 ? '앞으로' : '뒤로'} 가면 ${sino(r)}!`);
  }
  if (t.kind === 'calc' && !t.words) {
    const r = resultOf(t);
    return t.missing ? line(`${t.a} + ${t.b} = ${r}`, `${topic(sayExpr(t.a, '+', t.b))} ${sino(r)}`) : line(`${t.a} ${t.op} ${t.b} = ${r}`, `${topic(sayExpr(t.a, t.op, t.b))} ${sino(r)}`);
  }
  if (t.kind === 'ten') return line(`${t.a} + ${10 - t.a} = 10. 꽉 찼어!`, `${topic(sayExpr(t.a, '+', 10 - t.a))} 십. 꽉 찼어!`);
  return null;
}
