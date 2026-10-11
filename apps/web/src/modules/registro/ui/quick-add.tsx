import { useState, type ReactNode } from "react";
import { Icon } from "../../../design/ui/icons";

type QuickAddCardProps = {
  id: string;
  label: string;
  placeholder: string;
  pending: boolean;
  // Etiquetas embaixo do texto (prazo, linha, colaborador…), já com o que o grupo sugere.
  chips?: ReactNode;
  onAdd: (body: string, clear: () => void) => void;
  onCancel?: () => void;
  // No rodapé do grupo o cartão abre com o cursor no texto; na Entrada ele já está aberto e não puxa o teclado do celular.
  autoFocus?: boolean;
};

/**
 * Cartão de adicionar no estilo do Todoist: o texto em cima, as etiquetas embaixo e, à direita, cancelar e enviar.
 * Enter envia; Esc cancela.
 * Ex.: `<QuickAddCard id="nova-tarefa" label="Adicionar tarefa" placeholder="Nome da tarefa" pending={false} onAdd={add} />`
 */
export function QuickAddCard({ id, label, placeholder, pending, chips, onAdd, onCancel, autoFocus = true }: QuickAddCardProps) {
  const [body, setBody] = useState("");
  const text = body.trim();
  return (
    <form
      className="rounded-xl border border-line bg-surface p-3 shadow-sm focus-within:border-muted"
      onSubmit={(event) => {
        event.preventDefault();
        if (text && !pending) onAdd(text, () => setBody(""));
      }}
    >
      <input
        autoFocus={autoFocus}
        id={id}
        aria-label={label}
        placeholder={placeholder}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel?.();
        }}
        className="w-full bg-transparent text-[15px] text-app placeholder:text-muted focus:outline-none"
      />
      <div className="mt-3 flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">{chips}</div>
        {onCancel ? (
          <button type="button" aria-label="Cancelar" onClick={onCancel} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-chip hover:text-app">
            <Icon name="close" />
          </button>
        ) : null}
        <button
          type="submit"
          aria-label={label}
          disabled={pending || !text}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-contrast transition hover:brightness-90 disabled:opacity-40"
        >
          <Icon name="send" />
        </button>
      </div>
    </form>
  );
}

/**
 * "+ Adicionar …" no rodapé do grupo: abre o cartão de adicionar.
 * Ex.: `<AddRow label="Adicionar tarefa" placeholder="Nome da tarefa" id="nova-tarefa-hoje" pending={false} chips={<DueChip … />} onAdd={add} />`
 */
export function AddRow(props: Omit<QuickAddCardProps, "onCancel">) {
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div className="py-2.5">
        <QuickAddCard {...props} onCancel={() => setOpen(false)} />
      </div>
    );
  }
  return (
    <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 py-2.5 text-left text-sm text-muted transition hover:text-accent">
      <span aria-hidden="true" className="grid h-5 w-5 place-items-center text-lg leading-none text-accent">
        +
      </span>
      {props.label}
    </button>
  );
}
