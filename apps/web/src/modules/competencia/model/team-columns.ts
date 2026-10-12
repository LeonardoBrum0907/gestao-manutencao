import type { TeamColumnGroup, TeamCoverageStatus, TeamMatrixDto } from "@manutencao/shared";

// Uma coluna da grade: uma máquina de uma linha (agrupado por linha) ou um modelo de equipamento.
// A nota é sempre a do modelo, porque a matriz de habilidades é por modelo.
export type TeamColumn = { id: string; equipmentId: string; label: string; detail: string | null };

// Bloco de colunas com o cabeçalho de cima (a linha). Agrupado por modelo há um bloco só, sem título.
export type TeamColumnBlock = { id: string | null; label: string | null; detail: string | null; columns: TeamColumn[] };

// Filtros de colunas que não ficam salvos: os números do topo (status do modelo) e a escolha de linhas.
export type TeamColumnFilter = { status: TeamCoverageStatus | null; lineIds: readonly string[] };

export const UNLINKED_BLOCK_ID = "sem-maquina";

/**
 * Ordena pelo índice na ordem salva; o que não está na ordem vai para o fim, na ordem de chegada.
 * @example byLayoutOrder([{ id: "a" }, { id: "b" }], ["b"]) // [{ id: "b" }, { id: "a" }]
 */
export function byLayoutOrder<T extends { id: string }>(items: readonly T[], order: readonly string[]): T[] {
  const rank = new Map(order.map((id, index) => [id, index]));
  const position = (item: T, index: number) => rank.get(item.id) ?? order.length + index;
  return items
    .map((item, index) => ({ item, at: position(item, index) }))
    .sort((a, b) => a.at - b.at)
    .map(({ item }) => item);
}

function modelColumns(team: TeamMatrixDto, equipmentIds: readonly string[]): TeamColumn[] {
  return team.equipments
    .filter((equipment) => equipmentIds.includes(equipment.id))
    .map((equipment) => ({ id: equipment.id, equipmentId: equipment.id, label: equipment.name, detail: null }));
}

function lineBlocks(team: TeamMatrixDto, order: readonly string[]): TeamColumnBlock[] {
  const modelName = new Map(team.equipments.map((equipment) => [equipment.id, equipment.name]));
  return byLayoutOrder(team.lines, order).map((line) => ({
    id: line.id,
    label: line.name,
    detail: line.factoryName,
    columns: byLayoutOrder(line.machines, order).map((machine) => {
      const model = modelName.get(machine.equipmentId) ?? null;
      return { id: machine.id, equipmentId: machine.equipmentId, label: machine.name, detail: model === machine.name ? null : model };
    }),
  }));
}

// Modelo sem nenhuma máquina cadastrada continua aparecendo, num bloco no fim, para ninguém sumir da matriz.
function unlinkedBlock(team: TeamMatrixDto, order: readonly string[]): TeamColumnBlock[] {
  const linked = new Set(team.lines.flatMap((line) => line.machines.map((machine) => machine.equipmentId)));
  const columns = byLayoutOrder(modelColumns(team, team.equipments.filter((item) => !linked.has(item.id)).map((item) => item.id)), order);
  return columns.length ? [{ id: UNLINKED_BLOCK_ID, label: "Sem máquina cadastrada", detail: null, columns }] : [];
}

/**
 * Colunas da grade, na ordem que o gestor arrastou, já com os filtros do topo aplicados.
 * @example teamColumnBlocks(team, "line", layout.columnOrder, { status: null, lineIds: [] })
 */
export function teamColumnBlocks(team: TeamMatrixDto, group: TeamColumnGroup, order: readonly string[], filter: TeamColumnFilter): TeamColumnBlock[] {
  const blocks =
    group === "model"
      ? [{ id: null, label: null, detail: null, columns: byLayoutOrder(modelColumns(team, team.equipments.map((item) => item.id)), order) }]
      : [...lineBlocks(team, order), ...unlinkedBlock(team, order)];
  const statusOf = new Map(team.equipments.map((equipment) => [equipment.id, equipment.status]));
  const keepLine = (block: TeamColumnBlock) => !filter.lineIds.length || group === "model" || filter.lineIds.includes(block.id ?? "");
  return blocks
    .filter(keepLine)
    .map((block) => ({ ...block, columns: block.columns.filter((column) => !filter.status || statusOf.get(column.equipmentId) === filter.status) }))
    .filter((block) => block.columns.length > 0);
}

/**
 * Nova ordem salva depois de arrastar `activeId` para o lugar de `overId` entre irmãos (máquinas da mesma linha,
 * linhas entre si ou modelos). Só a ordem relativa dentro de cada grupo de irmãos importa.
 * @example moveColumn(["a", "b", "c"], "c", "a", []) // ["c", "a", "b"]
 */
export function moveColumn(siblingIds: readonly string[], activeId: string, overId: string, order: readonly string[]): string[] {
  const from = siblingIds.indexOf(activeId);
  const to = siblingIds.indexOf(overId);
  if (from < 0 || to < 0 || from === to) return [...order];
  const moved = [...siblingIds];
  moved.splice(to, 0, ...moved.splice(from, 1));
  const siblings = new Set(siblingIds);
  return [...order.filter((id) => !siblings.has(id)), ...moved];
}
