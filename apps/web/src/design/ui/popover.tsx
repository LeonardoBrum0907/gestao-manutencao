import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

// Peças da lista que abre sobre a tela, tiradas do select próprio para outros campos usarem:
// no computador flutua embaixo do campo; no celular, painel que sobe de baixo.

const PHONE = "(max-width: 639px)";

export function useIsPhone(): boolean {
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.matchMedia(PHONE).matches);
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const update = () => setPhone(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return phone;
}

export type Place = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

// Posição da lista no computador: embaixo do campo, ou em cima quando não há espaço.
export function usePlacement(open: boolean, anchor: RefObject<HTMLElement | null>): Place | null {
  const [place, setPlace] = useState<Place | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      setPlace(null);
      return;
    }
    function update() {
      const box = anchor.current?.getBoundingClientRect();
      if (!box) return;
      const below = window.innerHeight - box.bottom - 12;
      const above = box.top - 12;
      const up = below < 240 && above > below;
      const width = Math.max(box.width, 220);
      const left = Math.max(8, Math.min(box.left, window.innerWidth - width - 8));
      const maxHeight = Math.min(360, up ? above : below) - 6;
      setPlace(up ? { left, width, bottom: window.innerHeight - box.top + 6, maxHeight } : { left, width, top: box.bottom + 6, maxHeight });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchor]);
  return place;
}

// Fecha ao clicar fora do campo e da lista.
export function useOutsideClose(open: boolean, refs: RefObject<HTMLElement | null>[], close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    function onDown(event: PointerEvent) {
      const target = event.target as Node;
      if (refs.some((ref) => ref.current?.contains(target))) return;
      closeRef.current();
    }
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
    // As refs são estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

export function Cross({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

// A lista aberta: flutuando embaixo do campo no computador, ou painel de baixo no celular.
export function Panel({
  phone,
  place,
  panelRef,
  title,
  onClose,
  search,
  children,
  footer,
}: {
  phone: boolean;
  place: Place | null;
  panelRef: RefObject<HTMLDivElement | null>;
  title: string;
  onClose: () => void;
  search?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (phone) {
    return createPortal(
      <div className="fixed inset-0 z-[70] flex flex-col justify-end">
        <div className="absolute inset-0 bg-overlay" onClick={onClose} />
        <div
          ref={panelRef}
          role="dialog"
          aria-label={title}
          className="relative flex max-h-[75vh] flex-col gap-1 rounded-t-card border-t border-line bg-card px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 shadow-card"
        >
          <span className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden />
          <div className="flex items-center justify-between pl-1.5">
            <h2 className="text-[17px] font-semibold text-app">{title}</h2>
            <button type="button" aria-label="Fechar" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-control text-muted transition hover:bg-chip">
              <Cross size={18} />
            </button>
          </div>
          {search}
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">{children}</div>
          {footer}
        </div>
      </div>,
      document.body,
    );
  }
  if (!place) return null;
  return createPortal(
    <div
      ref={panelRef}
      style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom, maxHeight: place.maxHeight }}
      className="fixed z-[60] flex flex-col rounded-card border border-line bg-card shadow-pop"
    >
      {search ? <div className="p-1 pb-0">{search}</div> : null}
      <div className="flex min-h-0 flex-col overflow-y-auto p-1">{children}</div>
      {footer}
    </div>,
    document.body,
  );
}
