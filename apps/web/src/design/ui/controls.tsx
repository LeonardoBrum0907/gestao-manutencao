import { useId, useRef, type ButtonHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, type InputHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "./dialog";
import { NavTrail, type BackTo } from "./nav-trail";
import { FieldLabelContext } from "./select";

export { MultiSelect, SelectInput, type MultiOption } from "./select";

const tones = {
  primary: "bg-accent text-accent-contrast transition hover:brightness-90",
  ghost: "border border-line bg-chip text-app transition hover:bg-accent-soft",
  danger: "bg-danger text-canvas transition hover:brightness-90",
};

export function Button({
  tone = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof tones }) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex items-center justify-center rounded-control px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${tones[tone]} ${className}`}
    />
  );
}

export const controlClass =
  "w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-app transition hover:border-accent";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  const labelId = useId();
  return (
    <label className="flex flex-col gap-1.5 text-sm text-app">
      <span id={labelId} className="font-medium">
        {label}
      </span>
      <FieldLabelContext.Provider value={{ id: labelId, text: label }}>{children}</FieldLabelContext.Provider>
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${controlClass} min-h-32 ${props.className ?? ""}`} />;
}

export function Card({
  children,
  className = "",
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const pad = compact ? "px-4 py-3" : "p-4 sm:p-5";
  return (
    <section className={`rounded-card border border-line bg-card shadow-card ${pad} ${className}`}>
      {children}
    </section>
  );
}

export function Stat({ label, value, tone = "" }: { label: string; value: string | number; tone?: string }) {
  return (
    <Card compact>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone || "text-app"}`}>{value}</p>
    </Card>
  );
}

// Título da tela, com a barra de voltar e o caminho em cima. `crumb` é o nome da tela na trilha das
// telas que ela abrir (o título, se não vier); `back` é para onde voltar quando não há trilha.
export function PageTitle({
  eyebrow,
  title,
  text,
  action,
  crumb,
  back,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: ReactNode;
  crumb?: string;
  back?: BackTo;
}) {
  return (
    <>
      <NavTrail current={crumb ?? title} back={back} />
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-app">{title}</h1>
          {text ? <p className="mt-2 max-w-2xl text-sm text-muted">{text}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
    </>
  );
}

// Título de uma parte da página (dentro de Configurações, por exemplo): h2, sem sobretítulo.
export function SectionTitle({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-app">{title}</h2>
        {text ? <p className="mt-1 max-w-2xl text-sm text-muted">{text}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, onClose, panelRef);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto rounded-card border border-line bg-card p-4 shadow-card sm:p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-app">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-control px-2 py-1 text-lg leading-none text-muted transition hover:bg-chip hover:text-app"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="text-sm text-danger">{children}</p>;
}
