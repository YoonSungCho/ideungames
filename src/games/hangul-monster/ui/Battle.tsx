import { useEffect } from 'react';
import { josa } from '@/shared/korean';
import type { QuestionType } from '../../hangul-hero/engine/types';
import { ELEM_INFO, move, movesAt, species, type MoveId } from '../data/species';
import { ITEMS, MAPS } from '../data/world';
import { maxHp, xpNeed, type Mon } from '../engine/monster';
import { currentBeat, useHangulMonster } from '../store';
import { MonsterArt } from './MonsterArt';
import { QuestionPanel } from './QuestionPanel';
import styles from './HangulMonster.module.css';

/** 장면 하나를 보여 주는 시간 (누르면 바로 다음) */
const BEAT_MS = 1300;

export const Q_HINT: Record<QuestionType, string> = {
  listenConsonant: '자음 소리 듣기', firstSound: '첫소리 찾기', listenVowel: '모음 소리 듣기', syllableVowel: '모음 찾기',
  combine: '글자 만들기', build: '글자 만들기', batchimRead: '받침 낱말 읽기', batchimPick: '받침 찾기',
  pictureWord: '그림 낱말 읽기', missingSyllable: '빈칸 글자', sentenceBlank: '문장 빈칸', sentenceOrder: '문장 순서',
  oppositePick: '반대말', oppositeSentence: '반대말', categoryPick: '무리 짓기', oddOneOut: '무리 짓기',
};

export function HpBar({ m, showNumber }: { m: Mon; showNumber?: boolean }) {
  const max = maxHp(m);
  const r = m.hp / max;
  return (
    <div className={styles.hpRow}>
      <span className={styles.hpLabel}>HP</span>
      <div className={styles.hpBar} role="meter" aria-label="체력" aria-valuemin={0} aria-valuemax={max} aria-valuenow={m.hp}>
        <span className={r > 0.5 ? styles.hpHigh : r > 0.2 ? styles.hpMid : styles.hpLow} style={{ width: `${r * 100}%` }} />
      </div>
      {showNumber && <span className={styles.hpNum}>{m.hp}/{max}</span>}
    </div>
  );
}

function MonCard({ m, mine }: { m: Mon; mine?: boolean }) {
  const sp = species(m.sp);
  return (
    <div className={[styles.monCard, mine ? styles.myCard : styles.foeCard].join(' ')} aria-label={`${mine ? '내' : '상대'} ${sp.name} 레벨 ${m.lv} 체력 ${m.hp}`}>
      <p className={styles.monName}>
        <span className={styles.elemDot} style={{ background: ELEM_INFO[sp.elem].color }} title={ELEM_INFO[sp.elem].name}>{ELEM_INFO[sp.elem].icon}</span>
        {sp.name} <small>Lv.{m.lv}</small>
      </p>
      <HpBar m={m} showNumber={mine} />
      {mine && (
        <div className={styles.xpBar} aria-hidden>
          <span style={{ width: `${(m.xp / xpNeed(m.lv)) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

/** 포켓몬식 턴 배틀 화면 */
export function BattleScreen() {
  const b = useHangulMonster((s) => s.battle)!;
  const items = useHangulMonster((s) => s.items);
  const map = useHangulMonster((s) => s.map);
  const { nextBeat, battleMenu, chooseMove, answer, throwBall, battlePotion, switchMon, runAway } = useHangulMonster.getState();
  const beat = currentBeat(b);
  const viewing = b.phase === 'beats';
  const view = viewing ? beat.snap : b.state;
  const my = view.party[view.myIdx];
  const foe = view.foes[view.foeIdx];
  const fx = viewing ? beat.fx : undefined;
  const ballOut = viewing && (fx === 'ball' || fx === 'wobble' || fx === 'caught');

  // 장면은 저절로 넘어간다
  useEffect(() => {
    if (b.phase !== 'beats') return;
    const t = setTimeout(nextBeat, BEAT_MS);
    return () => clearTimeout(t);
  }, [b.phase, b.beatIdx, b.beats, nextBeat]);

  const moves = movesAt(my.sp, my.lv);
  const message = viewing ? beat.text : b.phase === 'party' && b.state.needSwitch ? '다음에 나갈 친구를 골라 줘!' : `${josa(species(my.sp).name, '은/는')} 무엇을 할까?`;

  return (
    <div className={[styles.battle, styles[`arena_${MAPS[map].theme}`]].join(' ')} data-battle>
      <div className={styles.arena}>
        <MonCard m={foe} />
        <div className={styles.foeSpot}>
          <div className={[styles.foeArt, fx && styles[`fx_${fx}`]].filter(Boolean).join(' ')} key={`foe${view.foeIdx}`}>
            {ballOut ? <span className={[styles.ball, fx === 'wobble' && styles.ballWobble, fx === 'caught' && styles.ballCaught].filter(Boolean).join(' ')} key={b.beatIdx}>🔴</span> : <MonsterArt sp={foe.sp} size={140} />}
            {viewing && fx === 'foeHit' && beat.dmg !== undefined && (
              <span className={[styles.dmg, beat.tag && styles[`tag_${beat.tag}`]].filter(Boolean).join(' ')} key={`d${b.beatIdx}`}>-{beat.dmg}</span>
            )}
          </div>
        </div>
        <div className={styles.mySpot}>
          <div className={[styles.myArt, fx && styles[`fx_${fx}`]].filter(Boolean).join(' ')} key={`me${view.myIdx}`}>
            <MonsterArt sp={my.sp} size={150} />
            {viewing && fx === 'myHit' && beat.dmg !== undefined && <span className={styles.dmg} key={`d${b.beatIdx}`}>-{beat.dmg}</span>}
          </div>
        </div>
        <MonCard m={my} mine />
      </div>

      <div className={styles.panel}>
        {b.phase !== 'question' && (
          <button className={styles.message} onClick={viewing ? nextBeat : undefined} disabled={!viewing} aria-live="polite" data-message>
            {message}
            {viewing && <span className={styles.more} aria-hidden>▼</span>}
          </button>
        )}

        {b.phase === 'menu' && (
          <div className={styles.actions}>
            <button className={[styles.action, styles.aFight].join(' ')} onClick={() => battleMenu('moves')}>⚔️ 싸우기</button>
            <button className={[styles.action, styles.aBag].join(' ')} onClick={() => battleMenu('bag')}>🎒 가방</button>
            <button className={[styles.action, styles.aParty].join(' ')} onClick={() => battleMenu('party')}>🔄 친구</button>
            <button className={[styles.action, styles.aRun].join(' ')} onClick={runAway}>🏃 도망</button>
          </div>
        )}

        {b.phase === 'moves' && (
          <div className={styles.moveList}>
            {moves.map((id: MoveId) => {
              const mv = move(id);
              return (
                <button key={id} className={styles.moveBtn} style={{ '--c': ELEM_INFO[mv.elem].color } as React.CSSProperties} onClick={() => chooseMove(id)} aria-label={mv.name}>
                  <b>{ELEM_INFO[mv.elem].icon} {mv.name}</b>
                  <small>{[...new Set(mv.q.map((t) => Q_HINT[t]))].join(' · ')} · 힘 {mv.power}</small>
                </button>
              );
            })}
            <button className={styles.backBtn} onClick={() => battleMenu('menu')}>← 뒤로</button>
          </div>
        )}

        {b.phase === 'question' && b.question && (
          <QuestionPanel q={b.question.q} moveName={move(b.question.moveId).name} onDone={answer} />
        )}

        {b.phase === 'bag' && (
          <div className={styles.moveList}>
            {b.state.kind === 'wild' && (
              <button className={styles.moveBtn} onClick={throwBall} disabled={items.ball <= 0} aria-label="한글볼 던지기">
                <b>{ITEMS.ball.emoji} 한글볼 ×{items.ball}</b>
                <small>{foe.hp / maxHp(foe) <= 0.5 ? '지금이 기회! 힘이 약해졌어' : '힘이 약할수록 잘 잡혀요'}</small>
              </button>
            )}
            {(['potion', 'bigPotion'] as const).map((it) => (
              <button key={it} className={styles.moveBtn} onClick={() => battlePotion(it, b.state.myIdx)} disabled={items[it] <= 0 || my.hp >= maxHp(my)} aria-label={ITEMS[it].name}>
                <b>{ITEMS[it].emoji} {ITEMS[it].name} ×{items[it]}</b>
                <small>{ITEMS[it].about}</small>
              </button>
            ))}
            <button className={styles.backBtn} onClick={() => battleMenu('menu')}>← 뒤로</button>
          </div>
        )}

        {b.phase === 'party' && (
          <div className={styles.partyPick}>
            {b.state.party.map((m, i) => (
              <button key={m.uid} className={[styles.partyMon, i === b.state.myIdx && styles.partyActive].filter(Boolean).join(' ')} onClick={() => switchMon(i)} disabled={m.hp <= 0 || i === b.state.myIdx} aria-label={`${species(m.sp).name} 내보내기`}>
                <MonsterArt sp={m.sp} size={44} />
                <span>
                  {species(m.sp).name} <small>Lv.{m.lv}</small>
                  <HpBar m={m} />
                </span>
              </button>
            ))}
            {!b.state.needSwitch && <button className={styles.backBtn} onClick={() => battleMenu('menu')}>← 뒤로</button>}
          </div>
        )}
      </div>
    </div>
  );
}
