import { useRef, type MouseEvent, type PointerEvent } from "react";

const HOLD_MS = 500;
// Dedo que andou mais que isso está rolando a lista, não segurando o cartão.
const MOVE_TOLERANCE_PX = 10;

type LongPressHandlers = {
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onContextMenu: (event: MouseEvent) => void;
  onClickCapture: (event: MouseEvent) => void;
};

/**
 * Tocar e segurar (dedo ou caneta), como na galeria do celular. O toque que terminou o "segurar" não vira clique.
 * @example <a {...useLongPress(() => marcar(rp.id))} href="…">…</a>
 */
export function useLongPress(onLongPress: () => void): LongPressHandlers {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const touch = useRef(false);

  function cancel() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }

  return {
    onPointerDown: (event) => {
      fired.current = false;
      // Com mouse a caixinha já aparece; segurar só vale no dedo (e na caneta).
      touch.current = event.pointerType !== "mouse";
      if (!touch.current) return;
      start.current = { x: event.clientX, y: event.clientY };
      cancel();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, HOLD_MS);
    },
    onPointerMove: (event) => {
      if (!start.current) return;
      const moved = Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y);
      if (moved > MOVE_TOLERANCE_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    // No Android, segurar um link abre o menu "abrir em nova aba": aqui segurar é marcar.
    onContextMenu: (event) => {
      if (touch.current) event.preventDefault();
    },
    onClickCapture: (event) => {
      if (!fired.current) return;
      fired.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
