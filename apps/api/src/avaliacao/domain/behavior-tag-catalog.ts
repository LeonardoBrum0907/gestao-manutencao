import { BEHAVIOR_TAG_GROUPS, type BehaviorTagDto, type BehaviorTagGroup } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export function assertBehaviorTagNameAvailable(ownerId: string | null, currentId: string | null): void {
  if (ownerId && ownerId !== currentId) {
    throw new DomainError("behavior_tag_name_taken", 409, "Já existe uma opção com esse nome nesta categoria.");
  }
}

// Marcada em alguma ficha, excluir apagaria o histórico: o caminho é arquivar.
export function assertBehaviorTagCanBeRemoved(memberCount: number): void {
  if (memberCount > 0) {
    const who = memberCount === 1 ? "1 colaborador" : `${memberCount} colaboradores`;
    throw new DomainError(
      "behavior_tag_in_use",
      409,
      `Esta opção está marcada em ${who}. Arquive para tirá-la das opções sem mexer em quem já tem.`,
    );
  }
}

// Categoria na ordem fixa da tela, e dentro dela a ordem do cadastro.
export function sortBehaviorTags<T extends { group: string; position: number; name: string }>(rows: T[]): T[] {
  const groupIndex = (group: string) => BEHAVIOR_TAG_GROUPS.findIndex((item) => item.key === group);
  return [...rows].sort(
    (a, b) => groupIndex(a.group) - groupIndex(b.group) || a.position - b.position || a.name.localeCompare(b.name, "pt-BR"),
  );
}

export function tagsOfGroup(catalog: BehaviorTagDto[], group: BehaviorTagGroup): string[] {
  return catalog.filter((tag) => tag.group === group).map((tag) => tag.id);
}
