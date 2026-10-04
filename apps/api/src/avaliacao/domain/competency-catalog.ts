import type { PerformanceCompetencyDto, PerformanceEntryDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export function assertCompetencyNameAvailable(ownerId: string | null, currentId: string | null): void {
  if (ownerId && ownerId !== currentId) {
    throw new DomainError("competency_name_taken", 409, "Já existe uma competência com esse nome.");
  }
}

// Com nota lançada, excluir apagaria o histórico: o caminho é arquivar.
export function assertCompetencyCanBeRemoved(scoreCount: number): void {
  if (scoreCount > 0) {
    throw new DomainError(
      "competency_in_use",
      409,
      "Esta competência já tem nota. Arquive para tirá-la da avaliação sem perder o histórico.",
    );
  }
}

export function assertScorable(competency: { archived: boolean }, score: number | null): void {
  if (competency.archived && score !== null) {
    throw new DomainError("competency_archived", 409, "Competência arquivada não recebe nota nova. Reative no cadastro.");
  }
}

// A nova ordem precisa trazer cada competência uma vez, nem mais nem menos.
export function requireOrder(ids: string[], existing: string[]): string[] {
  const unique = new Set(ids);
  if (unique.size !== ids.length || ids.length !== existing.length || existing.some((id) => !unique.has(id))) {
    throw new DomainError("invalid", 400, "A ordem precisa ter todas as competências, uma vez cada.");
  }
  return ids;
}

// Linhas do ano: as ativas, e as arquivadas só onde já têm nota, na ordem do cadastro.
export function rowsForYear(
  all: (PerformanceCompetencyDto & { position: number })[],
  entries: PerformanceEntryDto[],
): PerformanceCompetencyDto[] {
  const scored = new Set(entries.map((entry) => entry.competencyId));
  return [...all]
    .sort((a, b) => a.position - b.position)
    .filter((competency) => !competency.archived || scored.has(competency.id))
    .map(({ id, name, archived }) => ({ id, name, archived }));
}
