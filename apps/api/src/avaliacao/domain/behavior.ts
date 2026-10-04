import {
  BEHAVIOR_TAGS,
  isBehaviorRating,
  isBehaviorTag,
  isProductivityLevel,
  type BehaviorRating,
  type BehaviorTag,
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
  tags: BehaviorTag[];
};

function rating(value: string | null, label: string): BehaviorRating | null {
  if (value === null) return null;
  if (!isBehaviorRating(value)) throw new DomainError("invalid", 400, `${label} inválida.`);
  return value;
}

// Etiquetas sem repetição e na ordem do catálogo, para a tela e o banco verem sempre igual.
export function normalizeBehavior(input: BehaviorInput): Behavior {
  if (input.productivity !== null && !isProductivityLevel(input.productivity)) {
    throw new DomainError("invalid", 400, "Produtividade inválida.");
  }
  const unknown = input.tags.find((tag) => !isBehaviorTag(tag));
  if (unknown !== undefined) throw new DomainError("invalid", 400, "Etiqueta de comportamento inválida.");
  const chosen = new Set(input.tags);
  return {
    punctuality: rating(input.punctuality, "Pontualidade"),
    productivity: input.productivity,
    collaboration: rating(input.collaboration, "Colaboração"),
    tags: BEHAVIOR_TAGS.filter((tag) => chosen.has(tag)),
  };
}

export const EMPTY_BEHAVIOR: Behavior = { punctuality: null, productivity: null, collaboration: null, tags: [] };
