import {
  COMPETENCY_LEVEL_EXPECTED,
  type CompetencyEntryDto,
  type MatrixCatalogDto,
  type MatrixSkillDto,
} from "@manutencao/shared";

// above: nota acima do esperado; equal: igual (as duas contam como "atende"); below: abaixo.
export type SkillState = "above" | "equal" | "below" | "unscored" | "na";

export function entriesById(entries: CompetencyEntryDto[]): Map<string, CompetencyEntryDto> {
  return new Map(entries.map((entry) => [entry.skillId, entry]));
}

export function expectedOf(skill: MatrixSkillDto, entry: CompetencyEntryDto | undefined): number {
  return entry?.expected ?? COMPETENCY_LEVEL_EXPECTED[skill.level];
}

export function skillState(skill: MatrixSkillDto, entry: CompetencyEntryDto | undefined): SkillState {
  if (entry?.notApplicable) return "na";
  if (entry?.score === null || entry?.score === undefined) return "unscored";
  const expected = expectedOf(skill, entry);
  if (entry.score > expected) return "above";
  return entry.score === expected ? "equal" : "below";
}

export function equipmentName(catalog: MatrixCatalogDto, id: string): string {
  return catalog.equipments.find((equipment) => equipment.id === id)?.name ?? id;
}

// Na matriz do técnico só aparece o que está ativo no cadastro.
export function skillsOf(catalog: MatrixCatalogDto, equipmentId: string): MatrixSkillDto[] {
  return catalog.skills.filter((skill) => skill.equipmentId === equipmentId && !skill.archived);
}

// Agrupa pelo nome do subconjunto, na ordem em que ele aparece primeiro.
export function bySubgroup(skills: MatrixSkillDto[]): { subgroup: string; skills: MatrixSkillDto[] }[] {
  const groups = new Map<string, MatrixSkillDto[]>();
  for (const skill of skills) groups.set(skill.subgroup, [...(groups.get(skill.subgroup) ?? []), skill]);
  return [...groups].map(([subgroup, items]) => ({ subgroup, skills: items }));
}

function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function matchesSearch(skill: MatrixSkillDto, query: string): boolean {
  const needle = fold(query.trim());
  if (!needle) return true;
  return fold(skill.text).includes(needle) || fold(skill.subgroup).includes(needle);
}

export function percent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

export function average(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function meetsExpected(state: SkillState): boolean {
  return state === "above" || state === "equal";
}

// Cor do texto do resultado de cada habilidade.
export const stateTextClass: Record<SkillState, string> = {
  above: "font-semibold text-accent",
  equal: "font-semibold text-equal-text",
  below: "font-semibold text-danger",
  unscored: "text-muted",
  na: "text-muted",
};

// Habilidades ainda sem nota e que se aplicam: as que o "atende o esperado" preenche.
export function pendingExpected(skills: MatrixSkillDto[], entries: ReadonlyMap<string, CompetencyEntryDto>): MatrixSkillDto[] {
  return skills.filter((skill) => skillState(skill, entries.get(skill.id)) === "unscored");
}
