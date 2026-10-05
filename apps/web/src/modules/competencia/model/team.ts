import type { TeamEquipmentDto, TeamMatrixDto, TeamMemberDto } from "@manutencao/shared";
import { QUALIFIED_ADHERENCE } from "@manutencao/shared";

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

export function isQualified(adherence: number | null): boolean {
  return adherence !== null && adherence >= QUALIFIED_ADHERENCE;
}

export function qualifiedMembers(team: TeamMatrixDto, equipmentId: string): TeamMemberDto[] {
  return team.members.filter((member) => member.cells.some((cell) => cell.equipmentId === equipmentId && isQualified(cell.adherence)));
}

export function cellClass(adherence: number | null, scored: number): string {
  if (scored === 0) return "bg-chip text-muted";
  return isQualified(adherence) ? "bg-accent-soft text-accent" : "bg-danger-soft text-danger";
}

export function statusChipClass(status: TeamEquipmentDto["status"]): string {
  if (status === "ok") return "rounded-control bg-accent-soft px-2 py-1 text-xs font-semibold text-accent";
  if (status === "single") return "rounded-control bg-chip px-2 py-1 text-xs font-semibold text-app";
  return "rounded-control bg-danger-soft px-2 py-1 text-xs font-semibold text-danger";
}
