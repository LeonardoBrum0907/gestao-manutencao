import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject } from "../../kernel/parse";
import type { BehaviorInput } from "../domain/behavior";

export function parseBehavior(body: unknown): BehaviorInput {
  const source = readObject(body);
  const tags = source.tags ?? [];
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
    throw new DomainError("invalid", 400, "Etiquetas inválidas.");
  }
  return {
    punctuality: optionalString(source, "punctuality"),
    productivity: optionalString(source, "productivity"),
    collaboration: optionalString(source, "collaboration"),
    tags,
  };
}
