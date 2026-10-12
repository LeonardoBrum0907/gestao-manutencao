export type SortValue = string | number | null | undefined;
export type SortDirection = "asc" | "desc";
export type SortState = { key: string; direction: SortDirection };
export type RowGroup<T> = { key: string; title: string; rows: T[] };

// numeric: "MED 2" antes de "MED 10"; sensitivity base: "blistadeira" e "Blistadeira" empatam, "Anésio" fica junto de "Anesio".
const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

function isEmpty(value: SortValue): boolean {
  return value === null || value === undefined || value === "";
}

/**
 * Compara dois valores de uma coluna. Vazios ficam sempre no fim, nas duas direções.
 * @example compareSortValues("Celso", "anderson", "asc") // > 0
 */
export function compareSortValues(a: SortValue, b: SortValue, direction: SortDirection): number {
  if (isEmpty(a) || isEmpty(b)) return Number(isEmpty(a)) - Number(isEmpty(b));
  const order = typeof a === "number" && typeof b === "number" ? a - b : collator.compare(String(a), String(b));
  return direction === "asc" ? order : -order;
}

/**
 * Ordena uma cópia das linhas pelo valor de uma coluna; empates mantêm a ordem de chegada.
 * @example sortRows(members, (member) => member.name, "asc")
 */
export function sortRows<T>(rows: readonly T[], valueOf: (row: T) => SortValue, direction: SortDirection): T[] {
  return [...rows].sort((a, b) => compareSortValues(valueOf(a), valueOf(b), direction));
}

/**
 * Junta as linhas em grupos, na ordem em que cada grupo aparece primeiro.
 * @example groupRows(machines, (machine) => ({ key: machine.lineId, title: "Fábrica 2 · MED 02" }))
 */
export function groupRows<T>(rows: readonly T[], groupOf: (row: T) => { key: string; title: string }): RowGroup<T>[] {
  const groups = new Map<string, RowGroup<T>>();
  for (const row of rows) {
    const { key, title } = groupOf(row);
    const group = groups.get(key) ?? { key, title, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/**
 * Próximo estado ao clicar no cabeçalho: coluna nova começa crescente; a mesma coluna inverte.
 * @example nextSort({ key: "name", direction: "asc" }, "name") // { key: "name", direction: "desc" }
 */
export function nextSort(current: SortState | null, key: string): SortState {
  if (current?.key !== key) return { key, direction: "asc" };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}
