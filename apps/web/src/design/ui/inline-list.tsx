import { useState, type KeyboardEvent, type ReactNode } from "react";
import { errorMessage } from "../../app/http";
import { Button, Notice, controlClass } from "./controls";
import { DataTable, type TableColumn } from "./data-table";
import { Icon } from "./icons";
import { RemovalPrompt, type RemovalAlternative } from "./removal";
import { RowMenu, type RowMenuItem } from "./row-menu";

export type InlineItem = { id: string; name: string; meta?: ReactNode; muted?: boolean };

type Mode = { kind: "edit"; id: string } | { kind: "remove"; id: string } | { kind: "add" } | null;

export type InlineNameListProps<T extends InlineItem> = {
  items: T[];
  emptyText: string;
  // Títulos das colunas: o nome ("Grau", "Fábrica") e a coluna de meta ("Em uso", "Linhas").
  nameHeader?: string;
  metaHeader?: string;
  addLabel?: string;
  placeholder?: string;
  onAdd?: (name: string) => Promise<unknown>;
  onRename: (item: T, name: string) => Promise<unknown>;
  removalPath?: (item: T) => string;
  onRemove?: (item: T) => Promise<unknown>;
  alternative?: (item: T, done: () => void) => RemovalAlternative | undefined;
  menuItems?: (item: T) => RowMenuItem[];
  leading?: (item: T, index: number) => ReactNode;
};

type InlineEdit = ReturnType<typeof useInlineEdit>;

const iconButton =
  "grid h-9 w-9 shrink-0 place-items-center rounded-control text-muted transition hover:bg-chip hover:text-app sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100";

// Uma coisa em edição por vez (renomear, excluir ou adicionar), com o texto digitado e o erro da última tentativa.
function useInlineEdit() {
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

  return { mode, draft, setDraft, busy, error, start, run };
}

/**
 * Lista de cadastro que é só um nome, em tabela pequena: renomeia na própria linha, adiciona no pé e a
 * lixeira aparece ao passar o mouse (no celular fica sempre à vista). Excluir pergunta antes se o item está em uso.
 * A ordem é a do cadastro (algumas listas têm Subir e Descer), por isso as colunas não ordenam.
 * @example
 * <InlineNameList items={grades} nameHeader="Grau" emptyText="Nenhum grau ainda." addLabel="Adicionar grau"
 *   onAdd={(name) => save.mutateAsync({ name })} onRename={(grade, name) => save.mutateAsync({ id: grade.id, name })} />
 */
export function InlineNameList<T extends InlineItem>(props: InlineNameListProps<T>) {
  const edit = useInlineEdit();
  return (
    <DataTable
      label={props.nameHeader ?? "Itens"}
      rows={props.items}
      rowKey={(item) => item.id}
      columns={inlineColumns(props, edit)}
      override={(item) => editingRow(item, props, edit)}
      footer={
        <>
          {props.items.length === 0 && props.emptyText ? <p className="border-t border-line px-4 py-3 text-sm text-muted">{props.emptyText}</p> : null}
          <AddFooter props={props} edit={edit} />
        </>
      }
    />
  );
}

function inlineColumns<T extends InlineItem>(props: InlineNameListProps<T>, edit: InlineEdit): TableColumn<T>[] {
  const columns: TableColumn<T>[] = [];
  if (props.leading) columns.push({ key: "leading", header: "", cell: (item) => props.leading?.(item, props.items.indexOf(item)), className: "w-px pr-0" });
  columns.push({ key: "name", header: props.nameHeader ?? "Nome", cell: (item) => <NameButton item={item} edit={edit} /> });
  if (props.items.some((item) => item.meta)) columns.push({ key: "meta", header: props.metaHeader ?? "Em uso", cell: (item) => <span className="text-muted">{item.meta}</span>, className: "w-40" });
  columns.push({ key: "actions", header: "", cell: (item) => <RowActions item={item} props={props} edit={edit} />, align: "right", className: "w-px pr-2" });
  return columns;
}

function NameButton({ item, edit }: { item: InlineItem; edit: InlineEdit }) {
  return (
    <button
      type="button"
      title="Clique para renomear"
      onClick={() => edit.start({ kind: "edit", id: item.id }, item.name)}
      className={`max-w-full truncate py-1 text-left transition hover:text-accent ${item.muted ? "text-muted" : "text-app"}`}
    >
      {item.name}
    </button>
  );
}

function RowActions<T extends InlineItem>({ item, props, edit }: { item: T; props: InlineNameListProps<T>; edit: InlineEdit }) {
  return (
    <span className="flex items-center justify-end gap-1">
      <button type="button" aria-label={`Renomear ${item.name}`} className={iconButton} onClick={() => edit.start({ kind: "edit", id: item.id }, item.name)}>
        <Icon name="pencil" className="h-4 w-4" />
      </button>
      {props.removalPath && props.onRemove ? (
        <button
          type="button"
          aria-label={`Excluir ${item.name}`}
          className={`${iconButton} hover:!bg-danger-soft hover:!text-danger`}
          onClick={() => edit.start({ kind: "remove", id: item.id })}
        >
          <Icon name="trash" className="h-4 w-4" />
        </button>
      ) : null}
      {props.menuItems ? <RowMenu label={`Mais ações de ${item.name}`} items={props.menuItems(item)} /> : null}
    </span>
  );
}

// A linha em edição ocupa a largura toda da tabela; fora de edição devolve null e a linha normal aparece.
function editingRow<T extends InlineItem>(item: T, props: InlineNameListProps<T>, edit: InlineEdit): ReactNode {
  const { mode } = edit;
  if (mode?.kind === "edit" && mode.id === item.id) {
    return (
      <div className="bg-surface px-4 py-2">
        <NameForm label={`Novo nome de ${item.name}`} submitText="Gravar" closeText="Cancelar" edit={edit} onSubmit={(name) => props.onRename(item, name)} after={null} />
      </div>
    );
  }
  if (mode?.kind !== "remove" || mode.id !== item.id || !props.removalPath || !props.onRemove) return null;
  const { removalPath, onRemove } = props;
  return (
    <div className="p-2">
      <RemovalPrompt
        path={removalPath(item)}
        name={item.name}
        removing={edit.busy}
        error={edit.error}
        alternative={props.alternative?.(item, () => edit.start(null))}
        onConfirm={() => void edit.run(() => onRemove(item), null)}
        onCancel={() => edit.start(null)}
      />
    </div>
  );
}

function AddFooter<T extends InlineItem>({ props, edit }: { props: InlineNameListProps<T>; edit: InlineEdit }) {
  const { onAdd, addLabel } = props;
  if (!onAdd || !addLabel) return null;
  if (edit.mode?.kind === "add") {
    return (
      <div className="border-t border-line bg-surface px-4 py-2">
        <NameForm label={addLabel} placeholder={props.placeholder} submitText="Adicionar" closeText="Fechar" edit={edit} onSubmit={onAdd} after={{ kind: "add" }} />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => edit.start({ kind: "add" })}
      className="flex min-h-[48px] w-full items-center gap-2 border-t border-line px-4 text-left text-sm font-semibold text-accent transition hover:bg-accent-soft"
    >
      <Icon name="plus" className="h-4 w-4" />
      {addLabel}
    </button>
  );
}

type NameFormProps = {
  label: string;
  placeholder?: string;
  submitText: string;
  closeText: string;
  edit: InlineEdit;
  onSubmit: (name: string) => Promise<unknown>;
  // Depois de gravar: null fecha; { kind: "add" } deixa o campo aberto para o próximo nome.
  after: Mode;
};

function NameForm({ label, placeholder, submitText, closeText, edit, onSubmit, after }: NameFormProps) {
  const name = edit.draft.trim();
  function cancelOnEscape(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    edit.start(null);
  }
  return (
    <>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (name) void edit.run(() => onSubmit(name), after);
        }}
      >
        <input
          autoFocus
          aria-label={label}
          placeholder={placeholder}
          value={edit.draft}
          onChange={(event) => edit.setDraft(event.target.value)}
          onKeyDown={cancelOnEscape}
          className={`${controlClass} control-focus min-w-0 flex-1 py-2`}
        />
        <Button type="submit" className="py-2" disabled={edit.busy || !name}>
          {submitText}
        </Button>
        <Button tone="ghost" className="py-2" onClick={() => edit.start(null)}>
          {closeText}
        </Button>
      </form>
      {edit.error ? (
        <div className="mt-2">
          <Notice>{errorMessage(edit.error)}</Notice>
        </div>
      ) : null}
    </>
  );
}
