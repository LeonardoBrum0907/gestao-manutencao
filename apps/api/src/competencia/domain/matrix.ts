import {
  COMPETENCY_LEVEL_EXPECTED,
  type CompetencyScore,
  type CompetencySummaryDto,
  type MatrixCatalogDto,
  type MatrixSkillDto,
  type MemberPosition,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export type MatrixEntry = {
  skillId: string;
  score: CompetencyScore | null;
  notApplicable: boolean;
  expected: CompetencyScore | null;
};

export type EntryInput = {
  score: number | null;
  notApplicable: boolean;
  expected: number | null;
};

export function isCompetencyScore(value: number): value is CompetencyScore {
  return Number.isInteger(value) && value >= 0 && value <= 4;
}

export function expectedFor(skill: Pick<MatrixSkillDto, "level">, entry: MatrixEntry | undefined): number {
  return entry?.expected ?? COMPETENCY_LEVEL_EXPECTED[skill.level];
}

export function summarize(skills: readonly MatrixSkillDto[], entries: ReadonlyMap<string, MatrixEntry>): CompetencySummaryDto {
  let applicable = 0;
  let scored = 0;
  let above = 0;
  let exact = 0;
  let notApplicable = 0;
  let sum = 0;
  for (const skill of skills) {
    const entry = entries.get(skill.id);
    if (entry?.notApplicable) {
      notApplicable += 1;
      continue;
    }
    applicable += 1;
    if (entry?.score === null || entry?.score === undefined) continue;
    scored += 1;
    sum += entry.score;
    const expected = expectedFor(skill, entry);
    if (entry.score > expected) above += 1;
    else if (entry.score === expected) exact += 1;
  }
  const meets = above + exact;
  return {
    applicable,
    scored,
    meets,
    above,
    exact,
    below: scored - meets,
    unscored: applicable - scored,
    notApplicable,
    average: scored ? Math.round((sum / scored) * 10) / 10 : null,
    adherence: applicable ? Math.round((meets / applicable) * 100) : null,
  };
}

// Só o que está ativo entra na matriz. Equipamento ou habilidade arquivada fica guardada, fora da conta.
export function buildMatrix(catalog: MatrixCatalogDto, equipments: readonly string[], entries: readonly MatrixEntry[]) {
  const byId = new Map(entries.map((entry) => [entry.skillId, entry]));
  const selected = catalog.equipments.filter((equipment) => !equipment.archived && equipments.includes(equipment.id));
  const skillsOf = (id: string) => catalog.skills.filter((skill) => !skill.archived && skill.equipmentId === id);
  return {
    equipments: selected.map((equipment) => equipment.id),
    summary: summarize(
      selected.flatMap((equipment) => skillsOf(equipment.id)),
      byId,
    ),
    byEquipment: selected.map((equipment) => ({
      equipment: equipment.id,
      ...summarize(skillsOf(equipment.id), byId),
    })),
  };
}

export function assertMatrixEditable(position: MemberPosition): void {
  if (position !== "technician") {
    throw new DomainError("matrix_technician_only", 409, "A matriz de competências é só para técnico.");
  }
}

// O técnico marca só equipamento ativo; os arquivados que ele já tinha marcado continuam guardados.
export function requireEquipments(values: unknown, catalog: MatrixCatalogDto, current: readonly string[]): string[] {
  const active = new Set(catalog.equipments.filter((equipment) => !equipment.archived).map((equipment) => equipment.id));
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string" || !active.has(value))) {
    throw new DomainError("equipment", 400, "Equipamento inválido.");
  }
  const archived = new Set(catalog.equipments.filter((equipment) => equipment.archived).map((equipment) => equipment.id));
  return catalog.equipments
    .map((equipment) => equipment.id)
    .filter((id) => values.includes(id) || (archived.has(id) && current.includes(id)));
}

export function requireSkill(skillId: string, catalog: MatrixCatalogDto): MatrixSkillDto {
  const skill = catalog.skills.find((item) => item.id === skillId);
  if (!skill) throw new DomainError("not_found", 404, "Habilidade não encontrada.");
  const equipment = catalog.equipments.find((item) => item.id === skill.equipmentId);
  if (skill.archived || equipment?.archived) {
    throw new DomainError("skill_archived", 409, "Habilidade arquivada não recebe nota. Reative no cadastro da matriz.");
  }
  return skill;
}

export function normalizeEntry(skillId: string, input: EntryInput): MatrixEntry | null {
  if (input.score !== null && !isCompetencyScore(input.score)) {
    throw new DomainError("score", 400, "A nota vai de 0 a 4.");
  }
  if (input.expected !== null && (!isCompetencyScore(input.expected) || input.expected === 0)) {
    throw new DomainError("expected", 400, "O esperado vai de 1 a 4.");
  }
  if (input.notApplicable && input.score !== null) {
    throw new DomainError("score", 400, "Escolha a nota ou “não se aplica”, não os dois.");
  }
  if (input.score === null && !input.notApplicable && input.expected === null) return null;
  return {
    skillId,
    score: input.score as CompetencyScore | null,
    notApplicable: input.notApplicable,
    expected: input.expected as CompetencyScore | null,
  };
}
