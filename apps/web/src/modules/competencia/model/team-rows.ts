import { MEMBER_SHIFT_LABELS, MEMBER_SHIFTS, type MemberShift, type TeamMemberDto, type TeamRowGroup } from "@manutencao/shared";

// Ordenar técnicos pelo nome, por quantos modelos domina ou pela nota num modelo (id do modelo).
export type TeamSortKey = "name" | "count" | `equipment:${string}`;
export type TeamSort = { key: TeamSortKey; dir: 1 | -1 };

export type TeamRowBlock = { key: string | null; label: string | null; members: TeamMemberDto[] };

type TeamCell = TeamMemberDto["cells"][number];

export function cellOf(member: TeamMemberDto, equipmentId: string): TeamCell | undefined {
  return member.cells.find((cell) => cell.equipmentId === equipmentId);
}

export function isQualifiedCell(cell: TeamCell | undefined, threshold: number): boolean {
  return cell?.adherence != null && cell.adherence >= threshold;
}

export function qualifiedCount(member: TeamMemberDto, threshold: number): number {
  return member.cells.filter((cell) => isQualifiedCell(cell, threshold)).length;
}

export function shiftLabel(shift: string): string {
  return MEMBER_SHIFT_LABELS[shift as MemberShift] ?? shift;
}

// Valor de comparação: sem nota no modelo (ou modelo fora da matriz do técnico) fica sempre no fim.
function sortValue(member: TeamMemberDto, key: TeamSortKey, threshold: number): string | number | null {
  if (key === "name") return member.name;
  if (key === "count") return qualifiedCount(member, threshold);
  return cellOf(member, key.slice("equipment:".length))?.adherence ?? null;
}

/**
 * Técnicos na ordem pedida; empate e sem nota caem para a ordem do nome.
 * @example sortMembers(members, { key: "count", dir: -1 }, 80)
 */
export function sortMembers(members: readonly TeamMemberDto[], sort: TeamSort, threshold: number): TeamMemberDto[] {
  return [...members].sort((a, b) => {
    const x = sortValue(a, sort.key, threshold);
    const y = sortValue(b, sort.key, threshold);
    if (x === null || y === null) return x === y ? a.name.localeCompare(b.name) : x === null ? 1 : -1;
    const order = typeof x === "string" ? x.localeCompare(String(y)) : x - Number(y);
    return order * sort.dir || a.name.localeCompare(b.name);
  });
}

function groupKey(member: TeamMemberDto, group: TeamRowGroup): string | null {
  if (group === "shift") return member.shift;
  if (group === "grade") return member.gradeName;
  return member.teamName;
}

const missingLabel: Record<Exclude<TeamRowGroup, "none">, string> = { shift: "Sem turno", grade: "Sem grau", team: "Sem equipe" };

// Turnos na ordem do cadastro; grau e equipe em ordem alfabética. Quem não tem fica num bloco no fim.
function blockOrder(group: Exclude<TeamRowGroup, "none">, keys: readonly string[]): string[] {
  if (group === "shift") return [...MEMBER_SHIFTS.filter((shift) => keys.includes(shift)), ...keys.filter((key) => !(MEMBER_SHIFTS as readonly string[]).includes(key))];
  return [...keys].sort((a, b) => a.localeCompare(b));
}

/**
 * Técnicos em blocos (turno, grau ou equipe), cada bloco já ordenado. Sem agrupar, um bloco só sem título.
 * @example teamRowBlocks(members, "shift") // [{ key: "first", label: "1º turno", members: [...] }, ...]
 */
export function teamRowBlocks(sorted: readonly TeamMemberDto[], group: TeamRowGroup): TeamRowBlock[] {
  if (group === "none") return [{ key: null, label: null, members: [...sorted] }];
  const keys = [...new Set(sorted.map((member) => groupKey(member, group)).filter((key): key is string => key !== null))];
  const blocks = blockOrder(group, keys).map((key) => ({
    key,
    label: group === "shift" ? shiftLabel(key) : key,
    members: sorted.filter((member) => groupKey(member, group) === key),
  }));
  const missing = sorted.filter((member) => groupKey(member, group) === null);
  return missing.length ? [...blocks, { key: null, label: missingLabel[group], members: missing }] : blocks;
}

/**
 * Quantos técnicos do bloco estão qualificados no modelo: a linha de subtotal (ex.: qualificados no 2º turno).
 * @example blockQualified(block.members, "blistadeira-cam", 80) // 2
 */
export function blockQualified(members: readonly TeamMemberDto[], equipmentId: string, threshold: number): number {
  return members.filter((member) => isQualifiedCell(cellOf(member, equipmentId), threshold)).length;
}
