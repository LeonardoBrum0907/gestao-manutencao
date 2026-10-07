import { useId, useRef, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./controls";
import { useDialogFocus } from "./dialog";

// Painel que abre à direita da lista (no celular, de baixo para cima), com o cadastro inteiro do item.
// A lista continua visível atrás. Com onSubmit, corpo e rodapé viram um formulário só.
export function SidePanel({
  open,
  eyebrow,
  title,
  meta,
  onClose,
  onSubmit,
  notice,
  footer,
  children,
}: {
  open: boolean;
  eyebrow?: string;
  title: string;
  // Etiquetas e atalhos embaixo do título.
  meta?: ReactNode;
  onClose: () => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  // Faixa entre o corpo e o rodapé, para a pergunta de exclusão.
  notice?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, onClose, panelRef);

  if (!open) return null;

  const body = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
      {notice ? <div className="px-4 pb-4 sm:px-6">{notice}</div> : null}
      {footer ? (
        <div className="border-t border-line px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">{footer}</div>
      ) : null}
    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-end sm:items-stretch">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-card border-t border-line bg-card shadow-card sm:h-full sm:max-h-none sm:w-[520px] sm:rounded-none sm:border-l sm:border-t-0"
      >
        <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden" aria-hidden />
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 pb-4 pt-3 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{eyebrow}</p> : null}
            <h2 id={titleId} className="mt-1 text-xl font-semibold tracking-tight text-app">
              {title}
            </h2>
            {meta ? <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">{meta}</div> : null}
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-xl leading-none text-muted transition hover:bg-chip hover:text-app"
          >
            ×
          </button>
        </header>
        {onSubmit ? (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
            {body}
          </form>
        ) : (
          body
        )}
      </div>
    </div>,
    document.body,
  );
}

// Etiqueta pequena do cabeçalho do painel.
export function PanelTag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "danger" }) {
  const tones = {
    neutral: "bg-chip text-muted",
    accent: "bg-accent-soft text-accent",
    danger: "bg-danger-soft text-danger",
  };
  return <span className={`rounded-control px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

// Título de um bloco dentro do painel.
export function PanelSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

// Rodapé padrão: Gravar e Cancelar à esquerda, Excluir discreto à direita.
export function PanelFooter({
  saving,
  saveLabel = "Gravar",
  dirty,
  onCancel,
  onRemove,
}: {
  saving: boolean;
  saveLabel?: string;
  dirty?: boolean;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="submit" disabled={saving}>
        {saving ? "Gravando…" : saveLabel}
      </Button>
      <Button tone="ghost" onClick={onCancel}>
        Cancelar
      </Button>
      {dirty ? <span className="text-xs text-muted">Alterações não gravadas</span> : null}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto rounded-control px-2 py-2 text-sm font-semibold text-danger transition hover:bg-danger-soft"
        >
          Excluir…
        </button>
      ) : null}
    </div>
  );
}
