import { useEffect, useRef, type RefObject } from "react";

const focusable =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Janelas abertas, da de baixo para a de cima: só a de cima responde ao Esc e prende o Tab.
const stack: object[] = [];

// Modal e ficha do item: tira o resto da tela do alcance, foca o primeiro campo, Esc fecha e o Tab fica dentro.
export function useDialogFocus(open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement | null>) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const token = {};
    stack.push(token);
    const previously = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById("root");
    const wasInert = root?.hasAttribute("inert") ?? false;
    root?.setAttribute("inert", "");
    const panel = panelRef.current;
    const field = panel?.querySelector<HTMLElement>("input, select, textarea, [role=combobox]");
    (field ?? panel)?.focus();

    function onKey(event: KeyboardEvent) {
      if (stack[stack.length - 1] !== token) return;
      if (event.key === "Escape") {
        // Um select aberto dentro da janela já usou o Esc para fechar a lista.
        if (event.defaultPrevented) return;
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const nodes = [...panel.querySelectorAll<HTMLElement>(focusable)];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(token), 1);
      if (!wasInert) root?.removeAttribute("inert");
      previously?.focus();
    };
    // A ref é estável.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
