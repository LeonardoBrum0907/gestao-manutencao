import type { RpFormValues } from "./rp";

export type RpFieldKey = keyof RpFormValues;
export type RpFormErrors = Partial<Record<RpFieldKey, string>>;

const REQUIRED_MESSAGES: Partial<Record<RpFieldKey, string>> = {
  occurredAt: "Informe a data do relatório.",
  factoryId: "Escolha a fábrica.",
  problem: "Descreva o que ocorreu.",
  status: "Escolha o status.",
  memberIds: "Escolha pelo menos um técnico.",
  line: "Escolha a linha ou escreva o nome dela.",
  tag: "Informe a TAG.",
  description: "Conte o que foi observado.",
  rootCause: "Diga por que aconteceu.",
  corrective: "Diga o que foi feito agora.",
  preventive: "Diga como evitar que se repita.",
  basicConditionImpact: "Informe o impacto em condição básica.",
};

function isEmpty(value: RpFormValues[RpFieldKey]): boolean {
  if (Array.isArray(value)) return value.length === 0;
  return typeof value === "string" && !value.trim();
}

/**
 * Erro de "falta preencher" para cada campo obrigatório vazio, com a mensagem que aparece embaixo dele.
 * @example requiredFieldErrors({ ...valores, problem: "" }, ["problem"]) // { problem: "Descreva o que ocorreu." }
 */
export function requiredFieldErrors(values: RpFormValues, keys: readonly RpFieldKey[]): RpFormErrors {
  const errors: RpFormErrors = {};
  for (const key of keys) {
    if (isEmpty(values[key])) errors[key] = REQUIRED_MESSAGES[key] ?? "Preencha este campo.";
  }
  return errors;
}
