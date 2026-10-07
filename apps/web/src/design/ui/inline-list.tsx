import { useState, type KeyboardEvent, type ReactNode } from "react";
import { errorMessage } from "../../app/http";
import { Button, Notice, controlClass } from "./controls";
import { Icon } from "./icons";
import { RemovalPrompt, type RemovalAlternative } from "./removal";
import { RowMenu, type RowMenuItem } from "./row-menu";

export type InlineItem = { id: string; name: string; meta?: ReactNode; muted?: boolean };

type Mode = { kind: "edit"; id: string } | { kind: "remove"; id: string } | { kind: "add" } | null;

const iconButton =
  "grid h-9 w-9 shrink-0 place-items-center rounded-control text-muted transition hover:bg-chip hover:text-app sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100";

// Lista de cadastro que é só um nome: renomeia na própria linha, adiciona no pé e a lixeira aparece
// ao passar o mouse (no celular fica sempre à vista). Excluir pergunta antes se o item está em uso.
export function InlineNameList<T extends InlineItem>({
  items,
  emptyText,
  addLabel,
  placeholder,
  onAdd,
  onRename,
  removalPath,
  onRemove,
  alternative,
  menuItems,
  leading,
}: {
  items: T[];
  emptyText: string;
  addLabel?: string;
  placeholder?: string;
  onAdd?: (name: string) => Promise<unknown>;
  onRename: (item: T, name: string) => Promise<unknown>;
  removalPath?: (item: T) => string;
  onRemove?: (item: T) => Promise<unknown>;
  alternative?: (item: T, done: () => void) => RemovalAlternative | undefined;
  menuItems?: (item: T) => RowMenuItem[];
  leading?: (item: T, index: number) => ReactNode;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  function start(next: Mode, text = "") {
    setMode(next);
    setDraft(text);
    setError(null);
  }

  async function run(action: () => Promise<unknown>, after: Mode) {
    setBusy(true);
    setError(null);
    try {
      await action();
      start(after);
    } catch (caught) {
      setError(caught);
    } finally {
      setBusy(false);
    }
  }

  function cancelOnEscape(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      start(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <ul className="divide-y divide-line">
        {items.length === 0 ? <li className="px-4 py-3 text-sm text-muted">{emptyText}</li> : null}
        {items.map((item, index) => {
          const editing = mode?.kind === "edit" && mode.id === item.id;
          const removing = mode?.kind === "remove" && mode.id === item.id;
          if (editing) {
            return (
              <li key={item.id} className="bg-surface px-4 py-2">
                <form
                  className="flex flex-wrap items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (draft.trim()) void run(() => onRename(item, draft.trim()), null);
                  }}
                >
                  <input
                    autoFocus
                    aria-label={`Novo nome de ${item.name}`}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={cancelOnEscape}
                    className={`${controlClass} control-focus min-w-0 flex-1 py-2`}
                  />
                  <Button type="submit" className="py-2" disabled={busy || !draft.trim()}>
                    Gravar
                  </Button>
                  <Button tone="ghost" className="py-2" onClick={() => start(null)}>
                    Cancelar
                  </Button>
                </form>
                {error ? (
                  <div className="mt-2">
                    <Notice>{errorMessage(error)}</Notice>
                  </div>
                ) : null}
              </li>
            );
          }
          if (removing && removalPath && onRemove) {
            return (
              <li key={item.id} className="p-2">
                <RemovalPrompt
                  path={removalPath(item)}
                  name={item.name}
                  removing={busy}
                  error={error}
                  alternative={alternative?.(item, () => start(null))}
                  onConfirm={() => void run(() => onRemove(item), null)}
                  onCancel={() => start(null)}
                />
              </li>
            );
          }
          return (
            <li key={item.id} className="group flex min-h-[52px] items-center gap-2 py-1.5 pl-4 pr-2">
              {leading?.(item, index)}
              <button
                type="button"
                title="Clique para renomear"
                onClick={() => start({ kind: "edit", id: item.id }, item.name)}
                className={`min-w-0 flex-1 truncate py-1.5 text-left text-sm transition hover:text-accent ${item.muted ? "text-muted" : "text-app"}`}
              >
                {item.name}
              </button>
              {item.meta ? <span className="hidden shrink-0 text-xs text-muted sm:inline">{item.meta}</span> : null}
              <button
                type="button"
                aria-label={`Renomear ${item.name}`}
                className={iconButton}
                onClick={() => start({ kind: "edit", id: item.id }, item.name)}
              >
                <Icon name="pencil" className="h-4 w-4" />
              </button>
              {removalPath && onRemove ? (
                <button
                  type="button"
                  aria-label={`Excluir ${item.name}`}
                  className={`${iconButton} hover:!bg-danger-soft hover:!text-danger`}
                  onClick={() => start({ kind: "remove", id: item.id })}
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              ) : null}
              {menuItems ? <RowMenu label={`Mais ações de ${item.name}`} items={menuItems(item)} /> : null}
            </li>
          );
        })}
      </ul>
      {onAdd && addLabel ? (
        mode?.kind === "add" ? (
          <div className="border-t border-line bg-surface px-4 py-2">
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (draft.trim()) void run(() => onAdd(draft.trim()), { kind: "add" });
              }}
            >
              <input
                autoFocus
                aria-label={addLabel}
                placeholder={placeholder}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={cancelOnEscape}
                className={`${controlClass} control-focus min-w-0 flex-1 py-2`}
              />
              <Button type="submit" className="py-2" disabled={busy || !draft.trim()}>
                Adicionar
              </Button>
              <Button tone="ghost" className="py-2" onClick={() => start(null)}>
                Fechar
              </Button>
            </form>
            {error ? (
              <div className="mt-2">
                <Notice>{errorMessage(error)}</Notice>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => start({ kind: "add" })}
            className="flex min-h-[52px] w-full items-center gap-2 border-t border-line px-4 text-left text-sm font-semibold text-accent transition hover:bg-accent-soft"
          >
            <Icon name="plus" className="h-4 w-4" />
            {addLabel}
          </button>
        )
      ) : null}
    </div>
  );
}
