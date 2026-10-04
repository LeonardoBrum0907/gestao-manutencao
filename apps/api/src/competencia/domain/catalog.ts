import { isCompetencyLevel, type CompetencyLevel } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export function requireLevel(value: string): CompetencyLevel {
  if (!isCompetencyLevel(value)) throw new DomainError("invalid", 400, "Nível inválido. Use básico, intermediário ou avançado.");
  return value;
}

export function requireText(value: string, message: string): string {
  const text = value.trim();
  if (!text) throw new DomainError("invalid", 400, message);
  return text;
}

export function assertEquipmentNameAvailable(ownerId: string | null, currentId: string | null): void {
  if (ownerId && ownerId !== currentId) {
    throw new DomainError("equipment_name_taken", 409, "Já existe um equipamento com esse nome na matriz.");
  }
}

// Excluir só o que não deixa nada órfão; o resto se arquiva.
export function assertEquipmentCanBeRemoved(usage: { skills: number; members: number }): void {
  if (usage.skills > 0) {
    throw new DomainError(
      "equipment_in_use",
      409,
      "Este equipamento tem habilidades. Exclua ou mova as habilidades, ou arquive o equipamento.",
    );
  }
  if (usage.members > 0) {
    throw new DomainError("equipment_in_use", 409, "Há técnico com este equipamento marcado. Arquive em vez de excluir.");
  }
}

export function assertSkillCanBeRemoved(scoreCount: number): void {
  if (scoreCount > 0) {
    throw new DomainError(
      "skill_in_use",
      409,
      "Esta habilidade já foi avaliada. Arquive para tirá-la da matriz sem perder as notas.",
    );
  }
}
