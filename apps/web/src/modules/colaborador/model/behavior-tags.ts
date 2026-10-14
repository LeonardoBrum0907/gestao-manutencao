import type { BehaviorTagDto, BehaviorTagGroup } from "@manutencao/shared";

export type BehaviorTagChoice = { value: string; label: string };

/**
 * Opções de uma categoria do Comportamento para o select da ficha.
 * Arquivada só aparece em quem já tinha, para poder desmarcar.
 * Ex.: behaviorTagChoices(catalogo, "strengths", behavior.tags)
 */
export function behaviorTagChoices(catalog: BehaviorTagDto[], group: BehaviorTagGroup, selected: string[]): BehaviorTagChoice[] {
  return catalog
    .filter((tag) => tag.group === group && (!tag.archived || selected.includes(tag.id)))
    .map((tag) => ({ value: tag.id, label: tag.archived ? `${tag.name} (arquivada)` : tag.name }));
}

/**
 * Troca as marcadas de uma categoria e mantém as das outras, inclusive ids que não estão nas opções.
 * Ex.: replaceGroupTags(["a", "x"], ["a", "b"], ["b"]) devolve ["x", "b"]
 */
export function replaceGroupTags(tags: string[], groupIds: string[], next: string[]): string[] {
  return [...tags.filter((tag) => !groupIds.includes(tag)), ...next];
}
