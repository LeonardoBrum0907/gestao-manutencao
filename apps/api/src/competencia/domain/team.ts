import {
  skillFitsCategory,
  type MatrixCatalogDto,
  type MatrixCategory,
  type TeamCoverageStatus,
  type TeamEquipmentDto,
  type TeamMatrixDto,
} from "@manutencao/shared";
import { summarize, type ExpectedByLevel, type MatrixEntry } from "./matrix";

export type TeamMemberInput = {
  id: string;
  name: string;
  shift: string;
  teamId: string | null;
  gradeName: string | null;
  teamName: string | null;
  equipments: readonly string[];
  entries: readonly MatrixEntry[];
  expectedByLevel: ExpectedByLevel;
  // Categoria da função do técnico (null = vê as duas).
  matrixCategory: MatrixCategory | null;
  pdiOverdue: number;
};

// A matriz da equipe sem as linhas e a disposição salva, que vêm de outros cadastros.
export type TeamCoverage = Omit<TeamMatrixDto, "lines" | "layout">;

export function coverageStatus(qualified: number, minQualified: number): TeamCoverageStatus {
  if (qualified === 0) return "none";
  if (qualified < minQualified) return "short";
  if (qualified === 1) return "single";
  return "ok";
}

/**
 * Quem entra na Matriz da equipe com o filtro de categoria: quem é da categoria e quem vê as duas.
 * @example inTeamCategory({ matrixCategory: null }, "electrical") // true
 */
export function inTeamCategory(member: Pick<TeamMemberInput, "matrixCategory">, filter: MatrixCategory | null): boolean {
  return filter === null || member.matrixCategory === null || member.matrixCategory === filter;
}

// Visão da equipe: para cada equipamento ativo, quantos técnicos o têm na matriz e quantos estão qualificados
// (aderência a partir do corte configurado, 80% por padrão). Equipamento e habilidade arquivados ficam fora, como na matriz de cada técnico.
// Cada técnico conta só as habilidades da categoria dele; com o filtro de categoria, só as dessa categoria,
// e sai o equipamento que não tem nenhuma habilidade dela.
export function buildTeamMatrix(
  catalog: MatrixCatalogDto,
  members: readonly TeamMemberInput[],
  qualifiedAdherence: number,
  filter: MatrixCategory | null = null,
): TeamCoverage {
  const active = catalog.skills.filter((skill) => !skill.archived && skillFitsCategory(skill, filter));
  const equipments = catalog.equipments.filter(
    (equipment) => !equipment.archived && (filter === null || active.some((skill) => skill.equipmentId === equipment.id)),
  );
  const qualified = new Map<string, string[]>(equipments.map((equipment) => [equipment.id, []]));

  const rows = members.filter((member) => inTeamCategory(member, filter)).map((member) => {
    const byId = new Map(member.entries.map((entry) => [entry.skillId, entry]));
    const category = filter ?? member.matrixCategory;
    const skillsOf = (id: string) => active.filter((skill) => skill.equipmentId === id && skillFitsCategory(skill, category));
    const cells = equipments
      .filter((equipment) => member.equipments.includes(equipment.id))
      .map((equipment) => {
        const summary = summarize(skillsOf(equipment.id), byId, member.expectedByLevel);
        if (summary.adherence !== null && summary.adherence >= qualifiedAdherence) qualified.get(equipment.id)?.push(member.shift);
        return {
          equipmentId: equipment.id,
          adherence: summary.adherence,
          scored: summary.scored,
          applicable: summary.applicable,
          above: summary.above,
          exact: summary.exact,
          below: summary.below,
        };
      });
    const { id, name, shift, teamId, gradeName, teamName, pdiOverdue } = member;
    return { id, name, shift, teamId, gradeName, teamName, pdiOverdue, cells };
  });

  return {
    qualifiedAdherence,
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
