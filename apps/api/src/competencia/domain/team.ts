import {
  QUALIFIED_ADHERENCE,
  type MatrixCatalogDto,
  type TeamCoverageStatus,
  type TeamEquipmentDto,
  type TeamMatrixDto,
} from "@manutencao/shared";
import { summarize, type MatrixEntry } from "./matrix";

export type TeamMemberInput = {
  id: string;
  name: string;
  shift: string;
  teamId: string | null;
  equipments: readonly string[];
  entries: readonly MatrixEntry[];
  pdiOverdue: number;
};

export function coverageStatus(qualified: number, minQualified: number): TeamCoverageStatus {
  if (qualified === 0) return "none";
  if (qualified < minQualified) return "short";
  if (qualified === 1) return "single";
  return "ok";
}

// Visão da equipe: para cada equipamento ativo, quantos técnicos o têm na matriz e quantos estão qualificados
// (aderência >= 80%). Equipamento e habilidade arquivados ficam fora, como na matriz de cada técnico.
export function buildTeamMatrix(catalog: MatrixCatalogDto, members: readonly TeamMemberInput[]): TeamMatrixDto {
  const equipments = catalog.equipments.filter((equipment) => !equipment.archived);
  const skillsOf = (id: string) => catalog.skills.filter((skill) => !skill.archived && skill.equipmentId === id);
  const qualified = new Map<string, string[]>(equipments.map((equipment) => [equipment.id, []]));

  const rows = members.map((member) => {
    const byId = new Map(member.entries.map((entry) => [entry.skillId, entry]));
    const cells = equipments
      .filter((equipment) => member.equipments.includes(equipment.id))
      .map((equipment) => {
        const summary = summarize(skillsOf(equipment.id), byId);
        if (summary.adherence !== null && summary.adherence >= QUALIFIED_ADHERENCE) qualified.get(equipment.id)?.push(member.shift);
        return { equipmentId: equipment.id, adherence: summary.adherence, scored: summary.scored, applicable: summary.applicable, below: summary.below };
      });
    return { id: member.id, name: member.name, shift: member.shift, teamId: member.teamId, pdiOverdue: member.pdiOverdue, cells };
  });

  return {
    equipments: equipments.map((equipment): TeamEquipmentDto => {
      const shifts = qualified.get(equipment.id) ?? [];
      const qualifiedByShift: Record<string, number> = {};
      for (const shift of shifts) qualifiedByShift[shift] = (qualifiedByShift[shift] ?? 0) + 1;
      return {
        id: equipment.id,
        name: equipment.name,
        minQualified: equipment.minQualified,
        qualified: shifts.length,
        qualifiedByShift,
        status: coverageStatus(shifts.length, equipment.minQualified),
      };
    }),
    members: rows,
  };
}
