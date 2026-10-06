import {
  COMPETENCY_LEVEL_EXPECTED,
  type CompetencyEntryDto,
  type MatrixCatalogDto,
  type MatrixSkillDto,
} from "@manutencao/shared";

export type SkillState = "meets" | "below" | "unscored" | "na";

export function entriesById(entries: CompetencyEntryDto[]): Map<string, CompetencyEntryDto> {
  return new Map(entries.map((entry) => [entry.skillId, entry]));
}

export function expectedOf(skill: MatrixSkillDto, entry: CompetencyEntryDto | undefined): number {
  return entry?.expected ?? COMPETENCY_LEVEL_EXPECTED[skill.level];
}

export function skillState(skill: MatrixSkillDto, entry: CompetencyEntryDto | undefined): SkillState {
  if (entry?.notApplicable) return "na";
  if (entry?.score === null || entry?.score === undefined) return "unscored";
  return entry.score >= expectedOf(skill, entry) ? "meets" : "below";
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

export const stateRowClass: Record<SkillState, string> = {
  meets: "border-l-accent",
  below: "border-l-danger",
  unscored: "border-l-line",
  na: "border-l-line opacity-70",
};

export function adherenceTone(value: number | null): string {
  if (value === null) return "bg-line";
  if (value >= 80) return "bg-accent";
  return "bg-danger";
}

// Habilidades ainda sem nota e que se aplicam: as que o "atende o esperado" preenche.
export function pendingExpected(skills: MatrixSkillDto[], entries: ReadonlyMap<string, CompetencyEntryDto>): MatrixSkillDto[] {
  return skills.filter((skill) => skillState(skill, entries.get(skill.id)) === "unscored");
}
