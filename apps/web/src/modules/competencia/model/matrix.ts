import {
  COMPETENCY_EQUIPMENTS,
  COMPETENCY_LEVEL_EXPECTED,
  COMPETENCY_SKILLS,
  type CompetencyEntryDto,
  type CompetencySkill,
} from "@manutencao/shared";

export type SkillState = "meets" | "below" | "unscored" | "na";

export function entriesById(entries: CompetencyEntryDto[]): Map<string, CompetencyEntryDto> {
  return new Map(entries.map((entry) => [entry.skillId, entry]));
}

export function expectedOf(skill: CompetencySkill, entry: CompetencyEntryDto | undefined): number {
  return entry?.expected ?? COMPETENCY_LEVEL_EXPECTED[skill.level];
}

export function skillState(skill: CompetencySkill, entry: CompetencyEntryDto | undefined): SkillState {
  if (entry?.notApplicable) return "na";
  if (entry?.score === null || entry?.score === undefined) return "unscored";
  return entry.score >= expectedOf(skill, entry) ? "meets" : "below";
}

export function equipmentName(key: string): string {
  return COMPETENCY_EQUIPMENTS.find((equipment) => equipment.key === key)?.name ?? key;
}

export function skillsOf(equipment: string): CompetencySkill[] {
  return COMPETENCY_SKILLS.filter((skill) => skill.equipment === equipment);
}

export function bySubgroup(skills: CompetencySkill[]): { subgroup: string; skills: CompetencySkill[] }[] {
  const groups: { subgroup: string; skills: CompetencySkill[] }[] = [];
  for (const skill of skills) {
    const last = groups[groups.length - 1];
    if (last && last.subgroup === skill.subgroup) last.skills.push(skill);
    else groups.push({ subgroup: skill.subgroup, skills: [skill] });
  }
  return groups;
}

function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function matchesSearch(skill: CompetencySkill, query: string): boolean {
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
