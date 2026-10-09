import type { TeamEquipmentDto, TeamMatrixDto, TeamMemberDto } from "@manutencao/shared";

export const coverageLabel: Record<TeamEquipmentDto["status"], string> = {
  ok: "Coberto",
  single: "Ponto único",
  short: "Abaixo do mínimo",
  none: "Ninguém qualificado",
};

const severity: Record<TeamEquipmentDto["status"], number> = { none: 0, short: 1, single: 2, ok: 3 };

// Equipamentos com algum alerta, do mais grave para o menos.
export function alertsOf(team: TeamMatrixDto): TeamEquipmentDto[] {
  return team.equipments.filter((equipment) => equipment.status !== "ok").sort((a, b) => severity[a.status] - severity[b.status]);
}

export function isQualified(adherence: number | null, threshold: number): boolean {
  return adherence !== null && adherence >= threshold;
}

export function qualifiedMembers(team: TeamMatrixDto, equipmentId: string): TeamMemberDto[] {
  return team.members.filter((member) => member.cells.some((cell) => cell.equipmentId === equipmentId && isQualified(cell.adherence, team.qualifiedAdherence)));
}

export function cellClass(adherence: number | null, scored: number, threshold: number): string {
  if (scored === 0) return "bg-chip text-muted";
  return isQualified(adherence, threshold) ? "bg-accent-soft text-accent" : "bg-danger-soft text-danger";
}

// Qualificados / mínimo no cabeçalho da coluna.
export function coverageTextClass(status: TeamEquipmentDto["status"]): string {
  if (status === "ok") return "text-accent";
  if (status === "single") return "text-app";
  return "text-danger";
}

// Alertas agrupados por tipo, do mais grave para o menos.
export function alertGroups(team: TeamMatrixDto): { status: TeamEquipmentDto["status"]; equipments: TeamEquipmentDto[] }[] {
  const groups = new Map<TeamEquipmentDto["status"], TeamEquipmentDto[]>();
  for (const equipment of alertsOf(team)) groups.set(equipment.status, [...(groups.get(equipment.status) ?? []), equipment]);
  return [...groups].map(([status, equipments]) => ({ status, equipments }));
}

export function statusChipClass(status: TeamEquipmentDto["status"]): string {
  if (status === "ok") return "rounded-control bg-accent-soft px-2 py-1 text-xs font-semibold text-accent";
  if (status === "single") return "rounded-control bg-chip px-2 py-1 text-xs font-semibold text-app";
  return "rounded-control bg-danger-soft px-2 py-1 text-xs font-semibold text-danger";
}
