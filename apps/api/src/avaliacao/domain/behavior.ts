import {
  isBehaviorRating,
  isProductivityLevel,
  type BehaviorRating,
  type BehaviorTagDto,
  type ProductivityLevel,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export type BehaviorInput = {
  punctuality: string | null;
  productivity: string | null;
  collaboration: string | null;
  tags: string[];
};

export type Behavior = {
  punctuality: BehaviorRating | null;
  productivity: ProductivityLevel | null;
  collaboration: BehaviorRating | null;
  tags: string[];
};

function rating(value: string | null, label: string): BehaviorRating | null {
  if (value === null) return null;
  if (!isBehaviorRating(value)) throw new DomainError("invalid", 400, `${label} inválida.`);
  return value;
}

// Etiquetas sem repetição e na ordem do cadastro, para a tela e o banco verem sempre igual.
export function orderTags(tags: string[], catalog: BehaviorTagDto[]): string[] {
  const chosen = new Set(tags);
  return catalog.filter((tag) => chosen.has(tag.id)).map((tag) => tag.id);
}

// Opção arquivada não entra em ficha nova, mas quem já tinha pode mantê-la (ou desmarcar).
export function normalizeBehavior(input: BehaviorInput, catalog: BehaviorTagDto[], held: string[]): Behavior {
  if (input.productivity !== null && !isProductivityLevel(input.productivity)) {
    throw new DomainError("invalid", 400, "Produtividade inválida.");
  }
  const byId = new Map(catalog.map((tag) => [tag.id, tag]));
  for (const id of input.tags) {
    const tag = byId.get(id);
    if (!tag) throw new DomainError("invalid", 400, "Etiqueta de comportamento inválida.");
    if (tag.archived && !held.includes(id)) {
      throw new DomainError("behavior_tag_archived", 409, `"${tag.name}" está arquivada. Reative em Configurações › Avaliação.`);
    }
  }
  return {
    punctuality: rating(input.punctuality, "Pontualidade"),
    productivity: input.productivity,
    collaboration: rating(input.collaboration, "Colaboração"),
    tags: orderTags(input.tags, catalog),
  };
}

// O que o banco guarda já passou por normalizeBehavior; valor estranho vira "não avaliado" em vez de quebrar a ficha.
export function storedBehavior(row: BehaviorInput): Behavior {
  const known = (value: string | null) => (value !== null && isBehaviorRating(value) ? value : null);
  return {
    punctuality: known(row.punctuality),
    productivity: row.productivity !== null && isProductivityLevel(row.productivity) ? row.productivity : null,
    collaboration: known(row.collaboration),
    tags: row.tags,
  };
}

export const EMPTY_BEHAVIOR: Behavior = { punctuality: null, productivity: null, collaboration: null, tags: [] };
