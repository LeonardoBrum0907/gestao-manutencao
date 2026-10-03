import {
  COMPETENCY_EQUIPMENTS,
  COMPETENCY_LEVEL_EXPECTED,
  COMPETENCY_SKILLS,
  type CompetencyScore,
  type CompetencySkill,
  type CompetencySummaryDto,
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

const EQUIPMENT_KEYS: readonly string[] = COMPETENCY_EQUIPMENTS.map((equipment) => equipment.key);

export function isCompetencyScore(value: number): value is CompetencyScore {
  return Number.isInteger(value) && value >= 0 && value <= 4;
}

export function expectedFor(skill: CompetencySkill, entry: MatrixEntry | undefined): number {
  return entry?.expected ?? COMPETENCY_LEVEL_EXPECTED[skill.level];
}

export function summarize(skills: readonly CompetencySkill[], entries: ReadonlyMap<string, MatrixEntry>): CompetencySummaryDto {
  let applicable = 0;
  let scored = 0;
  let meets = 0;
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
    if (entry.score >= expectedFor(skill, entry)) meets += 1;
  }
  return {
    applicable,
    scored,
    meets,
    below: scored - meets,
    unscored: applicable - scored,
    notApplicable,
    average: scored ? Math.round((sum / scored) * 10) / 10 : null,
    adherence: applicable ? Math.round((meets / applicable) * 100) : null,
  };
}

export function buildMatrix(equipments: readonly string[], entries: readonly MatrixEntry[]) {
  const byId = new Map(entries.map((entry) => [entry.skillId, entry]));
  const selected = COMPETENCY_EQUIPMENTS.filter((equipment) => equipments.includes(equipment.key));
  const skillsOf = (key: string) => COMPETENCY_SKILLS.filter((skill) => skill.equipment === key);
  return {
    equipments: selected.map((equipment) => equipment.key),
    summary: summarize(
      selected.flatMap((equipment) => skillsOf(equipment.key)),
      byId,
    ),
    byEquipment: selected.map((equipment) => ({
      equipment: equipment.key,
      ...summarize(skillsOf(equipment.key), byId),
    })),
  };
}

export function requireEquipments(values: unknown): string[] {
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string" || !EQUIPMENT_KEYS.includes(value))) {
    throw new DomainError("equipment", 400, "Equipamento inválido.");
  }
  return EQUIPMENT_KEYS.filter((key) => values.includes(key));
}

export function requireSkill(skillId: string): CompetencySkill {
  const skill = COMPETENCY_SKILLS.find((item) => item.id === skillId);
  if (!skill) throw new DomainError("not_found", 404, "Habilidade não encontrada.");
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
