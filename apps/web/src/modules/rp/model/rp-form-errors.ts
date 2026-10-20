import type { RpFormValues } from "./rp";

type RpRequiredErrors = Partial<Record<keyof RpFormValues, string>>;

/**
 * Erros da ficha de RP do coordenador, um por campo, com as mesmas regras que a API confere
 * (apps/api/src/rp/application/parse-rp.ts). Vazio: pode gravar. O status sempre vem escolhido no select.
 * Antes, o erro da API aparecia só embaixo do botão, longe do campo: "Escolha a fábrica." a ~1.200 px da Fábrica.
 * @example rpFormErrors({ ...valores, factoryId: "" }).factoryId // "Escolha a fábrica."
 */
export function rpFormErrors(values: RpFormValues): RpRequiredErrors {
  const errors: RpRequiredErrors = {};
  if (!values.occurredAt) errors.occurredAt = "Informe a data do relatório.";
  if (!values.factoryId) errors.factoryId = "Escolha a fábrica.";
  if (!values.problem.trim()) errors.problem = "Descreva o que ocorreu.";
  return errors;
}
