import type { TeamEquipmentDto, TeamMatrixDto } from "@manutencao/shared";

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
