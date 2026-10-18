import { useEffect, useRef } from "react";
import { dragSelection } from "../model/public-rp-export";

type DragSelectOptions = {
  ids: readonly string[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
};

// Dedo a menos disso da borda de cima ou de baixo rola a lista sozinho, para dar para marcar além da tela.
const EDGE_PX = 80;
const EDGE_SPEED_PX = 12;

// A página pública rola dentro do PublicRpShell (overflow-y-auto), não na janela.
function scrollParent(element: Element | null): HTMLElement {
  for (let node = element?.parentElement; node; node = node.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node;
  }
  return document.documentElement;
}

// A barra de ações fica presa no pé e cobre os últimos cartões: a borda de baixo é o topo dela.
function visibleArea(scroller: HTMLElement): { top: number; bottom: number } {
  const box = scroller.getBoundingClientRect();
  const bar = document.querySelector("[data-selection-bar]")?.getBoundingClientRect();
  return { top: Math.max(box.top, 0), bottom: Math.min(bar?.top ?? box.bottom, window.innerHeight) };
}

function edgeScroll(y: number, scroller: HTMLElement): number {
  const area = visibleArea(scroller);
  if (y < area.top + EDGE_PX) return -EDGE_SPEED_PX;
  if (y > area.bottom - EDGE_PX) return EDGE_SPEED_PX;
  return 0;
}

// Cada cartão da lista leva data-rp-id: é assim que o dedo descobre em cima de qual RP está.
function rpIdAt(x: number, y: number): string | null {
  const element = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-rp-id]");
  return element?.dataset.rpId ?? null;
}

/**
 * Segurar um RP e arrastar o dedo marca os RPs por onde ele passa, como na galeria do celular.
 * Enquanto arrasta, a página não rola com o dedo (o touchmove é cancelado); perto da borda ela rola sozinha.
 * @example const drag = useDragSelect({ ids, selected, onChange: setSelected }); <RpListCard onHold={() => drag.begin(rp.id)} />
 */
export function useDragSelect({ ids, selected, onChange }: DragSelectOptions): { begin: (anchorId: string) => void } {
  const latest = useRef({ ids, selected, onChange });
  latest.current = { ids, selected, onChange };
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);

  function begin(anchorId: string) {
    stop.current?.();
    const base = new Set(latest.current.selected);
    const scroller = scrollParent(document.querySelector(`[data-rp-id="${CSS.escape(anchorId)}"]`));
    latest.current.onChange(dragSelection(base, latest.current.ids, anchorId, anchorId));
    let lastId = anchorId;
    let finger = { x: 0, y: 0 };
    let frame = 0;
    const pick = () => {
      const currentId = rpIdAt(finger.x, finger.y);
      if (!currentId || currentId === lastId) return;
      lastId = currentId;
      latest.current.onChange(dragSelection(base, latest.current.ids, anchorId, currentId));
    };
    const autoScroll = () => {
      const step = edgeScroll(finger.y, scroller);
      frame = step ? requestAnimationFrame(autoScroll) : 0;
      if (!step) return;
      scroller.scrollBy(0, step);
      pick();
    };
    const move = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      if (event.cancelable) event.preventDefault();
      finger = { x: touch.clientX, y: touch.clientY };
      pick();
      if (!frame) autoScroll();
    };
    const end = () => stop.current?.();
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    stop.current = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
      stop.current = null;
    };
  }

  return { begin };
}
