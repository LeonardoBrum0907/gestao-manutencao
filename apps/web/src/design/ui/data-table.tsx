import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { RowMenu, type RowMenuItem } from "./row-menu";
import { SelectInput } from "./select";
import { groupRows, nextSort, sortRows, type RowGroup, type SortState, type SortValue } from "./table-sort";

export type TableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  // Com sortValue o cabeçalho vira botão de ordenar.
  sortValue?: (row: T) => SortValue;
  align?: "right";
  // Texto que quebra em até duas linhas em vez de esticar a coluna: "long" para frases (problema do RP,
  // ocorrência), "short" para listas curtas (nomes dos técnicos), "rich" para texto longo com marcas
  // embaixo (chamado com RP e pendências): a célula corta o próprio texto para as marcas não sumirem.
  wrap?: "long" | "short" | "rich";
  className?: string;
};

// Como a linha aparece no celular, onde a tabela vira uma lista de dois ou três níveis.
export type StackedRow = { eyebrow?: ReactNode; title: ReactNode; meta?: ReactNode; side?: ReactNode };

export type RowActions = { label: string; items: RowMenuItem[] };

export type DataTableProps<T> = {
  label: string;
  rows: readonly T[];
  rowKey: (row: T) => string;
  columns: TableColumn<T>[];
  // Sem stacked, a mesma tabela aparece no celular (para tabelas de duas ou três colunas).
  stacked?: (row: T) => StackedRow;
  defaultSort?: SortState;
  groupBy?: (row: T) => { key: string; title: string };
  onOpen?: (row: T) => void;
  menu?: (row: T) => RowActions;
  selectedKey?: string | null;
  // Linha em edição (renomear, confirmar exclusão): ocupa a largura toda no lugar das colunas.
  override?: (row: T) => ReactNode | null;
  // Dentro de ficha ou painel, que já é a caixa: sem borda, sombra e fundo próprios.
  plain?: boolean;
  countLabel?: (count: number) => string;
  footer?: ReactNode;
};

type Shared<T> = DataTableProps<T> & { groups: RowGroup<T>[]; sort: SortState | null; setSort: (sort: SortState) => void };

const boxClass = "overflow-hidden rounded-card border border-line bg-card shadow-card";

/**
 * Tabela das listas do app (opção C): cabeçalho que ordena, faixas de grupo, menu ⋯ e versão empilhada no celular.
 * @example
 * <DataTable label="Colaboradores" rows={members} rowKey={(m) => m.id} columns={memberColumns}
 *   stacked={(m) => ({ title: m.name, meta: m.roleName })} onOpen={(m) => navigate(`/cadastro/colaboradores/${m.id}`)} />
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(props.defaultSort ?? null);
  const groups = useTableGroups(props, sort);
  const shared: Shared<T> = { ...props, groups, sort, setSort };
  if (!props.stacked) return <TableBox {...shared} />;
  return (
    <>
      <div className="hidden md:block">
        <TableBox {...shared} />
      </div>
      <div className="md:hidden">
        <StackedList {...shared} />
      </div>
    </>
  );
}

function useTableGroups<T>({ rows, columns, groupBy }: DataTableProps<T>, sort: SortState | null): RowGroup<T>[] {
  return useMemo(() => {
    const column = columns.find((item) => item.key === sort?.key);
    const order = (items: T[]) => (column?.sortValue && sort ? sortRows(items, column.sortValue, sort.direction) : items);
    if (!groupBy) return [{ key: "", title: "", rows: order([...rows]) }];
    return groupRows(rows, groupBy).map((group) => ({ ...group, rows: order(group.rows) }));
  }, [rows, columns, groupBy, sort]);
}

function TableBox<T>(props: Shared<T>) {
  const span = props.columns.length + (props.menu ? 1 : 0);
  return (
    <div className={props.plain ? "" : boxClass}>
      <div className="overflow-x-auto">
        <table aria-label={props.label} className="w-full border-collapse text-sm">
          <TableHead {...props} />
          {props.groups.map((group) => (
            <tbody key={group.key}>
              {group.title ? <GroupBand title={group.title} span={span} /> : null}
              {group.rows.map((row) => (
                <TableRow key={props.rowKey(row)} row={row} span={span} {...props} />
              ))}
            </tbody>
          ))}
        </table>
      </div>
      {props.footer}
    </div>
  );
}

function TableHead<T>({ columns, menu, sort, setSort, plain }: Shared<T>) {
  return (
    <thead>
      <tr className={`border-b border-line-strong ${plain ? "" : "bg-chip"}`}>
        {columns.map((column) => (
          <HeaderCell key={column.key} column={column} sort={sort} onSort={() => setSort(nextSort(sort, column.key))} />
        ))}
        {menu ? <th className="w-12" aria-label="Ações" /> : null}
      </tr>
    </thead>
  );
}

const headText = "text-xs font-semibold uppercase tracking-[0.08em]";

function HeaderCell<T>({ column, sort, onSort }: { column: TableColumn<T>; sort: SortState | null; onSort: () => void }) {
  const active = sort?.key === column.key;
  const ariaSort = active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined;
  const align = column.align === "right" ? "text-right" : "text-left";
  if (!column.sortValue) return <th className={`whitespace-nowrap px-3 py-2.5 text-muted ${headText} ${align}`}>{column.header}</th>;
  return (
    <th aria-sort={ariaSort} className={`whitespace-nowrap px-1.5 py-1 ${align}`}>
      <button
        type="button"
        onClick={onSort}
        className={`control-focus inline-flex items-center gap-1 rounded-md px-1.5 py-1.5 transition hover:bg-accent-soft ${headText} ${active ? "text-accent-ink" : "text-muted"}`}
      >
        {column.header}
        <span aria-hidden className={active ? "" : "opacity-0"}>
          {active && sort.direction === "desc" ? "↓" : "↑"}
        </span>
      </button>
    </th>
  );
}

function GroupBand({ title, span }: { title: string; span: number }) {
  return (
    <tr className="border-b border-line-strong bg-group">
      <th colSpan={span} scope="colgroup" className="px-3 py-1.5 text-left text-[13px] font-semibold text-app">
        {title}
      </th>
    </tr>
  );
}

// Clique em botão, link ou campo dentro da linha faz só a ação dele, sem abrir o item.
function fromControl(event: MouseEvent): boolean {
  return Boolean((event.target as HTMLElement).closest("a, button, input, select, textarea, label, [role=menu]"));
}

function TableRow<T>(props: Shared<T> & { row: T; span: number }) {
  const { row, columns, onOpen, menu, override, selectedKey, rowKey, span } = props;
  const custom = override?.(row);
  if (custom) return <tr className="border-b border-line last:border-b-0"><td colSpan={span}>{custom}</td></tr>;
  const selected = selectedKey === rowKey(row);
  return (
    <tr
      onClick={onOpen ? (event) => !fromControl(event) && onOpen(row) : undefined}
      className={`border-b border-line transition last:border-b-0 ${onOpen ? "cursor-pointer hover:bg-accent-soft" : ""} ${selected ? "bg-accent-soft" : ""}`}
    >
      {columns.map((column, index) => (
        <BodyCell key={column.key} column={column} row={row} openLabel={index === 0 && onOpen ? () => onOpen(row) : undefined} />
      ))}
      {menu ? (
        <td className="w-12 py-0.5 pr-1.5 text-right">
          <RowMenu {...menu(row)} />
        </td>
      ) : null}
    </tr>
  );
}

const WRAP_SHAPE = {
  long: "min-w-[13rem] max-w-[28rem] whitespace-normal",
  rich: "min-w-[13rem] max-w-[28rem] whitespace-normal",
  short: "min-w-[8rem] max-w-[14rem] whitespace-normal",
};

function BodyCell<T>({ column, row, openLabel }: { column: TableColumn<T>; row: T; openLabel?: () => void }) {
  const clamp = column.wrap === "long" || column.wrap === "short";
  const content = clamp ? <span className="line-clamp-2">{column.cell(row)}</span> : column.cell(row);
  const shape = column.wrap ? WRAP_SHAPE[column.wrap] : "whitespace-nowrap";
  return (
    <td className={`px-3 py-2.5 align-middle text-app ${shape} ${column.align === "right" ? "text-right tabular-nums" : ""} ${column.className ?? ""}`}>
      {openLabel ? (
        // O primeiro campo é o botão de abrir para quem usa teclado; o mouse abre pela linha toda.
        <button type="button" onClick={openLabel} className="control-focus rounded text-left font-medium hover:underline">
          {content}
        </button>
      ) : (
        content
      )}
    </td>
  );
}

function StackedList<T>(props: Shared<T>) {
  const count = props.groups.reduce((total, group) => total + group.rows.length, 0);
  return (
    <div className={props.plain ? "" : boxClass}>
      <SortBar {...props} count={count} />
      {props.groups.map((group) => (
        <section key={group.key} aria-label={group.title || props.label}>
          {group.title ? <div className="border-b border-line-strong bg-group px-3 py-1.5 text-[13px] font-semibold text-app">{group.title}</div> : null}
          <ul>
            {group.rows.map((row) => (
              <StackedItem key={props.rowKey(row)} row={row} {...props} />
            ))}
          </ul>
        </section>
      ))}
      {props.footer}
    </div>
  );
}

function SortBar<T>({ columns, sort, setSort, countLabel, count }: Shared<T> & { count: number }) {
  const sortable = columns.filter((column) => column.sortValue);
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line-strong bg-chip px-3 py-1.5 text-[13px] text-muted">
      <span>{countLabel ? countLabel(count) : count}</span>
      {sortable.length ? (
        <span className="flex items-center gap-1">
          <SelectInput variant="chip" aria-label="Ordenar por" value={sort?.key ?? ""} onChange={(event) => setSort({ key: event.target.value, direction: "asc" })}>
            <option value="">Ordem padrão</option>
            {sortable.map((column) => (
              <option key={column.key} value={column.key}>
                {column.header}
              </option>
            ))}
          </SelectInput>
          {sort ? <DirectionButton sort={sort} setSort={setSort} /> : null}
        </span>
      ) : null}
    </div>
  );
}

function DirectionButton({ sort, setSort }: { sort: SortState; setSort: (sort: SortState) => void }) {
  const label = sort.direction === "asc" ? "Crescente" : "Decrescente";
  return (
    <button type="button" aria-label={`${label}; tocar inverte`} onClick={() => setSort(nextSort(sort, sort.key))} className="control-focus rounded-md px-2 py-1 hover:bg-surface">
      {sort.direction === "asc" ? "↑" : "↓"}
    </button>
  );
}

function StackedItem<T>(props: Shared<T> & { row: T }) {
  const { row, stacked, onOpen, menu, override, selectedKey, rowKey } = props;
  const custom = override?.(row);
  if (custom) return <li className="border-b border-line last:border-b-0">{custom}</li>;
  const view = stacked!(row);
  return (
    <li className={`flex items-center gap-2 border-b border-line pr-1.5 last:border-b-0 ${selectedKey === rowKey(row) ? "bg-accent-soft" : ""}`}>
      <StackedBody view={view} onOpen={onOpen ? () => onOpen(row) : undefined} />
      {menu ? <RowMenu {...menu(row)} /> : null}
    </li>
  );
}

function StackedBody({ view, onOpen }: { view: StackedRow; onOpen?: () => void }) {
  // O lado (status, chip) vai na última linha, junto da meta: assim o título e o texto de cima usam a largura toda.
  const body = (
    <span className="block min-w-0 flex-1">
      {view.eyebrow ? <span className="block text-xs text-muted">{view.eyebrow}</span> : null}
      <span className="block font-medium text-app">{view.title}</span>
      {view.meta || view.side ? (
        <span className="mt-0.5 flex items-center justify-between gap-3 text-[13px]">
          <span className="min-w-0 text-muted">{view.meta}</span>
          {view.side ? <span className="shrink-0 text-right">{view.side}</span> : null}
        </span>
      ) : null}
    </span>
  );
  const shape = "flex min-w-0 flex-1 px-3 py-2.5 text-left";
  if (!onOpen) return <div className={shape}>{body}</div>;
  return (
    <button type="button" onClick={onOpen} className={`${shape} transition hover:bg-accent-soft`}>
      {body}
    </button>
  );
}
