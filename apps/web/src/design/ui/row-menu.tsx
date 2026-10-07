import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";

export type RowMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type Place = { top?: number; bottom?: number; right: number };

// Menu ⋯ da linha: as ações menos usadas (arquivar, excluir) saem da vista e ficam aqui.
// A lista flutua por cima da página, então não é cortada por cartão com borda arredondada.
export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useLayoutEffect(() => {
    if (!open) {
      setPlace(null);
      return;
    }
    const box = buttonRef.current?.getBoundingClientRect();
    if (!box) return;
    const right = Math.max(8, window.innerWidth - box.right);
    const up = window.innerHeight - box.bottom < 48 * items.length + 24 && box.top > window.innerHeight - box.bottom;
    setPlace(up ? { bottom: window.innerHeight - box.top + 4, right } : { top: box.bottom + 4, right });
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]:not([disabled])")?.focus();
    function onDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onMove() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  function close(focusButton: boolean) {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const nodes = [...(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]:not([disabled])") ?? [])];
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      nodes[(index + 1) % nodes.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      nodes[(index - 1 + nodes.length) % nodes.length]?.focus();
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(!open);
        }}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-control border transition ${
          open ? "border-line bg-chip text-app" : "border-transparent text-muted hover:border-line hover:bg-chip hover:text-app"
        }`}
      >
        <Icon name="dots" />
      </button>
      {open && place
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={label}
              onKeyDown={onMenuKey}
              style={{ top: place.top, bottom: place.bottom, right: place.right }}
              className="fixed z-[60] flex w-56 flex-col gap-0.5 rounded-xl border border-line bg-card p-1 shadow-[0_12px_32px_rgb(28_40_34_/_0.14)]"
            >
              {items.map((item, index) => (
                <div key={item.label} className="contents">
                  {item.danger && index > 0 ? <div className="mx-1.5 my-1 h-px bg-line" aria-hidden /> : null}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      close(false);
                      item.onSelect();
                    }}
                    className={`flex min-h-10 w-full items-center rounded-lg px-2.5 text-left text-sm transition disabled:opacity-50 ${
                      item.danger ? "text-danger hover:bg-danger-soft focus:bg-danger-soft" : "text-app hover:bg-chip focus:bg-chip"
                    } focus:outline-none`}
                  >
                    {item.label}
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
