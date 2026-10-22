import { useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { create } from 'zustand';

/**
 * 게임이 허브 상단 바 가운데에 자기 버튼(모드·난이도 등)을 넣는 자리.
 * 내용이 있으면 제목 대신 보인다 → 화면 위 줄 수를 줄여 보드를 크게.
 */
const useSlot = create<{ el: HTMLElement | null }>(() => ({ el: null }));

export function HeaderSlotTarget({ className }: { className?: string }) {
  const ref = useCallback((el: HTMLDivElement | null) => useSlot.setState({ el }), []);
  return <div ref={ref} className={className} />;
}

export function HeaderSlot({ children }: { children: ReactNode }) {
  const el = useSlot((s) => s.el);
  return el ? createPortal(children, el) : null;
}
