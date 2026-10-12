import type { TeamCoverageStatus, TeamMatrixDto } from "@manutencao/shared";
import { trainingNeeds } from "../../competencia/model/team-insights";

// Turnos de produção mostrados na cobertura (o administrativo não cobre turno).
export const COVERAGE_SHIFTS = ["first", "second", "third"] as const;

export type CoverageRow = { id: string; name: string; minQualified: number; qualified: number; status: TeamCoverageStatus; byShift: number[] };

const severity: Record<TeamCoverageStatus, number> = { none: 0, short: 1, single: 2, ok: 3 };

/**
 * Qualificados por turno em cada modelo, do mais grave (ninguém qualificado) para o coberto.
 * Modelo sem mínimo e que ninguém tem na matriz fica de fora: não é usado e só pintaria a tabela de vermelho.
 * @example coverageRows(team)[0] // { name: "Encaixotadora CAM", status: "none", byShift: [0, 0, 0], … }
 */
export function coverageRows(team: TeamMatrixDto): CoverageRow[] {
  const assigned = new Set(team.members.flatMap((member) => member.cells.map((cell) => cell.equipmentId)));
  return team.equipments
    .filter((equipment) => equipment.minQualified > 0 || assigned.has(equipment.id))
    .map((equipment) => ({
      id: equipment.id,
      name: equipment.name,
      minQualified: equipment.minQualified,
      qualified: equipment.qualified,
      status: equipment.status,
      byShift: COVERAGE_SHIFTS.map((shift) => equipment.qualifiedByShift[shift] ?? 0),
    }))
    .sort((a, b) => severity[a.status] - severity[b.status] || a.name.localeCompare(b.name, "pt-BR"));
}

export type TrainingPick = { memberId: string; name: string; equipmentName: string; adherence: number; gap: number };

/**
 * Os técnicos mais perto do corte nos modelos em risco, um por linha, os mais próximos primeiro.
 * @example trainingTop(team, 3)[0] // { name: "Bia", equipmentName: "Encartuchadeira CAM", adherence: 72, gap: 8 }
 */
export function trainingTop(team: TeamMatrixDto, limit: number): TrainingPick[] {
  return trainingNeeds(team)
    .flatMap((need) => need.candidates.map((candidate) => ({ ...candidate, equipmentName: need.name })))
    .sort((a, b) => a.gap - b.gap || a.name.localeCompare(b.name, "pt-BR"))
    .slice(0, limit)
    .map(({ memberId, name, equipmentName, adherence, gap }) => ({ memberId, name, equipmentName, adherence, gap }));
}

/**
 * Itens de PDI vencidos somando todos os técnicos.
 * @example pdiOverdueTotal(team) // 2
 */
export function pdiOverdueTotal(team: TeamMatrixDto): number {
  return team.members.reduce((sum, member) => sum + member.pdiOverdue, 0);
}
