import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, type InputHTMLAttributes } from "react";
import { createPortal } from "react-dom";

const tones = {
  primary: "bg-accent text-accent-contrast",
  ghost: "border border-line bg-surface text-app",
  danger: "bg-danger-soft text-danger",
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
  "w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-app";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-app">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${controlClass} min-h-32 ${props.className ?? ""}`} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${controlClass} ${props.className ?? ""}`} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-card border border-line bg-card p-4 shadow-card sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

export function PageTitle({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-app">{title}</h1>
        {text ? <p className="mt-2 max-w-2xl text-sm text-muted">{text}</p> : null}
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

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-app/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-lg overflow-y-auto rounded-card border border-line bg-card p-4 shadow-card sm:p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-app">
            {title}
          </h2>
          <Button tone="ghost" onClick={onClose}>
            Fechar
          </Button>
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
