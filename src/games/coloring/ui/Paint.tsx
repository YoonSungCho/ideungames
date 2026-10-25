import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { callName } from '@/shared/korean';
import { useSettings } from '@/shared/settings/store';
import { Button } from '@/shared/ui/Button';
import { Confetti } from '@/shared/ui/Confetti';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { HeaderSlot } from '@/shared/ui/HeaderSlot';
import { Modal } from '@/shared/ui/Modal';
import { picture, type Picture } from '../data/pictures';
import { progress, simplify, strokePath } from '../engine/art';
import { RAINBOW, useColoring } from '../store';
import { Drawing } from './Drawing';
import { savePng } from './save';
import { Options, Palette, Tools } from './Toolbar';
import styles from './Coloring.module.css';

/** 그림판: 조각을 누르면 칠하고, 붓이면 손가락으로 그린다 */
function Canvas({ pic, svgRef }: { pic: Picture; svgRef: React.RefObject<SVGSVGElement | null> }) {
  const art = useColoring((s) => s.art[pic.id]);
  const tool = useColoring((s) => s.tool);
  const color = useColoring((s) => s.color);
  const brushSize = useColoring((s) => s.brushSize);
  const event = useColoring((s) => s.event);
  const [draft, setDraft] = useState<number[] | null>(null);
  const pts = useRef<number[]>([]);

  const toLocal = (e: PointerEvent) => {
    const svg = svgRef.current!;
    const m = svg.getScreenCTM()!.inverse();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10];
  };
  const down = (e: PointerEvent<SVGRectElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pts.current = toLocal(e);
    setDraft(pts.current);
  };
  const move = (e: PointerEvent) => {
    if (!draft) return;
    pts.current = [...pts.current, ...toLocal(e)];
    setDraft(pts.current);
  };
  const up = () => {
    if (!draft) return;
    useColoring.getState().drawStroke(pic.id, { pts: simplify(pts.current, 1.2) });
    pts.current = [];
    setDraft(null);
  };

  const brush = tool === 'brush';
  const draftColor = color === RAINBOW ? '#9b6bff' : color;
  return (
    <div className={styles.canvasWrap}>
      <div className={[styles.canvas, brush && styles.brushing].filter(Boolean).join(' ')}>
        <Drawing
          ref={svgRef}
          pic={pic}
          art={art}
          title={`${pic.name} 그림`}
          partProps={(p) => ({
            role: brush ? undefined : 'button',
            'aria-label': brush ? undefined : `${p.name}${art?.fills[p.id] ? ', 칠함' : ''}`,
            'data-part': p.id,
            'data-fill': art?.fills[p.id] ?? '',
            className: [styles.part, event?.part === p.id && styles.flash].filter(Boolean).join(' '),
            key: event?.part === p.id ? `${p.id}-${event.key}` : p.id,
            onClick: brush ? undefined : () => useColoring.getState().tapPart(pic.id, p.id),
          })}
          overlay={draft && <path d={strokePath(draft)} fill="none" stroke={draftColor} strokeWidth={brushSize} strokeLinecap="round" strokeLinejoin="round" />}
          top={brush && (
            <rect data-ui width="200" height="200" fill="transparent" className={styles.brushPad} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="붓으로 그리기" />
          )}
        />
      </div>
    </div>
  );
}

function DoneModal({ pic, onClose, onSave }: { pic: Picture; onClose: () => void; onSave: () => void }) {
  const art = useColoring((s) => s.art[pic.id]);
  const name = useSettings((s) => s.playerName);
  const navigate = useNavigate();
  return (
    <>
      <Confetti />
      <Modal open labelledBy="done-title" onClose={onClose}>
        <div className={styles.done}>
          <Drawing pic={pic} art={art} className={styles.donePic} />
          <h2 id="done-title">🎨 {callName(name)}, 멋진 {pic.name} 완성!</h2>
          <p className={styles.doneSub}>붓으로 더 꾸며도 되고, 그림으로 저장해도 돼.</p>
          <div className={styles.doneActions}>
            <Button size="lg" onClick={onClose}>계속 꾸미기</Button>
            <Button variant="secondary" onClick={() => navigate('/games/coloring')}>다른 그림 칠하기</Button>
            <Button variant="ghost" onClick={onSave}>📷 그림 저장</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function Paint() {
  const { pic: picId } = useParams();
  const pic = picture(picId ?? '');
  const art = useColoring((s) => (pic ? s.art[pic.id] : undefined));
  const canUndo = useColoring((s) => !!pic && (s.history[pic.id]?.length ?? 0) > 0);
  const event = useColoring((s) => s.event);
  const svgRef = useRef<SVGSVGElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [doneKey, setDoneKey] = useState<number | null>(null);
  const seenKey = useRef(event?.key ?? 0);

  // 이 화면에서 새로 다 칠했을 때만 축하 창
  useEffect(() => {
    if (event?.kind === 'done' && event.key > seenKey.current) setDoneKey(event.key);
    seenKey.current = Math.max(seenKey.current, event?.key ?? 0);
  }, [event]);

  if (!pic) return <Navigate to="/games/coloring" replace />;
  const { filled, total } = progress(pic, art);
  const save = () => svgRef.current && void savePng(svgRef.current, `${pic.name} 색칠`);
  const empty = !art || (!Object.keys(art.fills).length && !art.strokes.length);

  return (
    <div className={styles.paint}>
      <HeaderSlot>
        <span className={styles.picChip} aria-label={`${pic.name}, ${total}곳 중 ${filled}곳 칠함`}>
          {pic.icon} {pic.name} <b>{filled}/{total}</b>
        </span>
      </HeaderSlot>
      <Canvas pic={pic} svgRef={svgRef} />
      <div className={styles.panel}>
        <Tools onUndo={() => useColoring.getState().undo(pic.id)} canUndo={canUndo} onReset={() => !empty && setConfirmReset(true)} onSave={save} />
        <Options />
        <Palette />
      </div>
      <ConfirmDialog
        open={confirmReset}
        title="처음부터 다시 칠할까?"
        message="칠한 색과 붓 그림이 지워져요. (되돌리기로 살릴 수 있어요)"
        cancelLabel="그대로 둘래"
        confirmLabel="다 지우기"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          useColoring.getState().reset(pic.id);
          setConfirmReset(false);
        }}
      />
      {doneKey !== null && <DoneModal pic={pic} onClose={() => setDoneKey(null)} onSave={save} />}
    </div>
  );
}
