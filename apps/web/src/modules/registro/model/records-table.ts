import type { RecordListItemDto, RecordStatus, RecordType } from "@manutencao/shared";

// Tela Registros: todos os registros (tarefa, problema, feedback) numa tabela com busca, filtros e agrupar.

export type RecordRow = RecordListItemDto & {
  lineName: string | null;
  machineName: string | null;
  subassemblyName: string | null;
  memberName: string | null;
};

export type RecordNames = {
  lines: Map<string, string>;
  machines: Map<string, string>;
  subassemblies: Map<string, string>;
  members: Map<string, string>;
};

/** Junta à linha os nomes do cadastro (linha, máquina, subconjunto, pessoa), para mostrar e procurar. */
export function withNames(item: RecordListItemDto, names: RecordNames): RecordRow {
  const name = (map: Map<string, string>, id: string | null) => (id ? map.get(id) ?? null : null);
  return {
    ...item,
    lineName: name(names.lines, item.lineId),
    machineName: name(names.machines, item.machineId),
    subassemblyName: name(names.subassemblies, item.subassemblyId),
    memberName: name(names.members, item.memberId),
  };
}

/** Lugar em uma linha: "MED 01 › Blistadeira › Desbobinador"; vazio quando o registro não aponta lugar. */
export function placeLabel(row: RecordRow): string {
  return [row.lineName, row.machineName, row.subassemblyName].filter(Boolean).join(" › ");
}

export const STATUS_SCOPES = ["abertos", "concluidos", "todos"] as const;
export type StatusScope = (typeof STATUS_SCOPES)[number];

export type RecordFilter = {
  q: string;
  type: RecordType | null;
  scope: StatusScope;
  lineId: string | null;
  memberId: string | null;
};

// Sem acento e em minúsculas: "manutenção" acha "MANUTENCAO".
function plain(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function inScope(status: RecordStatus, scope: StatusScope): boolean {
  if (scope === "todos") return true;
  return scope === "concluidos" ? status === "done" : status !== "done";
}

/** Busca no texto, no lugar e na pessoa; todas as palavras precisam aparecer. Ex.: "med01 correia". */
export function matchesSearch(row: RecordRow, q: string): boolean {
  const words = plain(q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = plain([row.body, placeLabel(row), row.memberName ?? ""].join(" "));
  return words.every((word) => haystack.includes(word));
}

/**
 * Aplica busca e filtros, menos o tipo quando `ignoreType` (para contar cada aba com os outros filtros).
 * @example filterRecords(rows, { q: "correia", type: "task", scope: "abertos", lineId: null, memberId: null })
 */
export function filterRecords(rows: readonly RecordRow[], filter: RecordFilter, ignoreType = false): RecordRow[] {
  return rows.filter(
    (row) =>
      (ignoreType || !filter.type || row.type === filter.type) &&
      inScope(row.status, filter.scope) &&
      (!filter.lineId || row.lineId === filter.lineId) &&
      (!filter.memberId || row.memberId === filter.memberId) &&
      matchesSearch(row, filter.q),
  );
}

// Sem ordenação escolhida: abertos primeiro (em andamento antes de aberto), depois os mais recentes.
const statusRank: Record<RecordStatus, number> = { in_progress: 0, open: 1, done: 2 };

export function defaultRecordOrder(a: RecordRow, b: RecordRow): number {
  return statusRank[a.status] - statusRank[b.status] || b.occurredAt.localeCompare(a.occurredAt);
}

export const GROUP_MODES = ["nenhum", "tipo", "linha", "maquina", "situacao", "pessoa"] as const;
export type GroupMode = (typeof GROUP_MODES)[number];

const typeTitle: Record<RecordType, string> = { task: "Tarefas", problem: "Problemas", feedback: "Feedbacks", entry: "Rascunhos" };
const statusTitle: Record<RecordStatus, string> = { in_progress: "Em andamento", open: "Abertos", done: "Concluídos" };

const NO_GROUP = "sem";

/**
 * Faixa de grupo da linha no modo escolhido; o "Sem …" tem a chave "sem" e vai por último (sortByGroup).
 * @example recordGroup(row, "linha") // { key: "MED 01", title: "MED 01" }
 */
export function recordGroup(row: RecordRow, mode: Exclude<GroupMode, "nenhum">): { key: string; title: string } {
  if (mode === "tipo") return { key: String(["task", "problem", "feedback", "entry"].indexOf(row.type)), title: typeTitle[row.type] };
  if (mode === "situacao") return { key: String(statusRank[row.status]), title: statusTitle[row.status] };
  if (mode === "pessoa") return row.memberName ? { key: row.memberName, title: row.memberName } : { key: NO_GROUP, title: "Sem pessoa" };
  if (mode === "linha") return row.lineName ? { key: row.lineName, title: row.lineName } : { key: NO_GROUP, title: "Sem linha" };
  const machine = row.machineName ? [row.lineName, row.machineName].filter(Boolean).join(" · ") : null;
  return machine ? { key: machine, title: machine } : { key: NO_GROUP, title: "Sem máquina" };
}

/** Ordena as linhas pelos grupos (para as faixas saírem na ordem), mantendo a ordem de dentro de cada grupo. */
export function sortByGroup(rows: readonly RecordRow[], mode: Exclude<GroupMode, "nenhum">): RecordRow[] {
  const key = (row: RecordRow) => recordGroup(row, mode).key;
  const last = (row: RecordRow) => Number(key(row) === NO_GROUP);
  return [...rows].sort((a, b) => last(a) - last(b) || key(a).localeCompare(key(b), "pt-BR"));
}
