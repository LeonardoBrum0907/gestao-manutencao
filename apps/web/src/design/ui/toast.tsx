import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ToastInput = { text: string; action?: { label: string; run: () => void } };
type Toast = ToastInput & { id: number };

const ToastContext = createContext<(toast: ToastInput) => void>(() => undefined);

// Aviso curto no pé da tela depois de gravar, arquivar ou excluir; some sozinho.
export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const counter = useRef(0);

  const show = useCallback((input: ToastInput) => {
    counter.current += 1;
    setToast({ ...input, id: counter.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast((current) => (current?.id === toast.id ? null : current)), toast.action ? 8000 : 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {createPortal(
        <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex justify-center sm:justify-start lg:left-[272px]">
          {toast ? (
            <div className="pointer-events-auto flex items-center gap-4 rounded-xl bg-app px-4 py-3 text-sm text-canvas shadow-card">
              <span>{toast.text}</span>
              {toast.action ? (
                <button
                  type="button"
                  className="font-semibold text-accent-soft underline-offset-2 hover:underline"
                  onClick={() => {
                    toast.action?.run();
                    setToast(null);
                  }}
                >
                  {toast.action.label}
                </button>
              ) : null}
              <button type="button" aria-label="Fechar aviso" className="text-canvas opacity-70 transition hover:opacity-100" onClick={() => setToast(null)}>
                ×
              </button>
            </div>
          ) : null}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
