import {
  DEFAULT_MATRIX_CATEGORY,
  isCompetencyLevel,
  isMatrixCategory,
  MATRIX_CATEGORIES,
  PERFORMANCE_SCORES,
  type CompetencyLevel,
  type MatrixCategory,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export function requireLevel(value: string): CompetencyLevel {
  if (!isCompetencyLevel(value)) throw new DomainError("invalid", 400, "Nível inválido. Use básico, intermediário ou avançado.");
  return value;
}

/**
 * Categoria da habilidade. Sem o campo vale a de antes: a atual ao editar, mecânico ao criar
 * (a tela antiga e as ferramentas do MCP anteriores à categoria não mandam nada).
 * @example requireCategory(undefined, "electrical") // "electrical"
 */
export function requireCategory(value: unknown, fallback: MatrixCategory): MatrixCategory {
  if (value === undefined) return fallback;
  if (!isMatrixCategory(value)) {
    throw new DomainError("invalid", 400, `Categoria inválida: ${JSON.stringify(value)}. Use ${MATRIX_CATEGORIES.join(" ou ")}.`);
  }
  return value;
}

/**
 * Filtro de categoria vindo do endereço: vazio é a equipe toda.
 * @example optionalCategory("") // null
 */
export function optionalCategory(value: string | undefined): MatrixCategory | null {
  if (!value) return null;
  return requireCategory(value, DEFAULT_MATRIX_CATEGORY);
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
export type EquipmentUsage = { skills: number; members: number; subassemblies: number; machines: number; documents: number; techCards: number };

export function assertEquipmentCanBeRemoved(usage: EquipmentUsage): void {
  // Sem esta trava, o banco apagaria o modelo das máquinas em silêncio.
  if (usage.machines > 0) {
    throw new DomainError("equipment_in_use", 409, "Há máquinas deste modelo. Arquive em vez de excluir.");
  }
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
  if (usage.subassemblies > 0) {
    throw new DomainError("equipment_in_use", 409, "Este equipamento tem subconjuntos cadastrados. Arquive em vez de excluir.");
  }
  if (usage.documents > 0 || usage.techCards > 0) {
    throw new DomainError("equipment_in_use", 409, "Este modelo tem documentação técnica (documentos ou fichas). Arquive em vez de excluir.");
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

export function requireMinQualified(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 99) {
    throw new DomainError("invalid", 400, "O mínimo de qualificados vai de 0 a 99.");
  }
  return value;
}

export function requirePerformanceTarget(value: unknown): number {
  if (typeof value !== "number" || !(PERFORMANCE_SCORES as readonly number[]).includes(value)) {
    throw new DomainError("invalid", 400, `A meta de desempenho é uma das notas: ${PERFORMANCE_SCORES.join(", ")}.`);
  }
  return value;
}

export function requireQualifiedAdherence(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 100) {
    throw new DomainError("invalid", 400, "A aderência para qualificar vai de 1 a 100.");
  }
  return value;
}
