import type { RpFormValues } from "../../rp/model/rp";

// Os mesmos limites que a API confere (apps/api/src/rp-publico/application/parse-public-rp.ts): a tela avisa
// embaixo de cada campo antes de mandar, e o servidor continua sendo a última palavra.
const SHORT_MAX = 120;
const LONG_MAX = 2000;
const SHORT_FIELDS = ["orderNumber", "line", "tag", "repeatedTimes", "repeatedPeriod"] as const;
const LONG_FIELDS = ["problem", "description", "rootCause", "corrective", "preventive", "basicConditionImpact"] as const;

export type RpFieldKey = keyof RpFormValues;
export type RpFormErrors = Partial<Record<RpFieldKey, string>>;

/** Campos que o RP não grava sem. */
export const RP_REQUIRED_FIELDS: readonly RpFieldKey[] = ["occurredAt", "factoryId", "problem", "status", "memberIds"];

const REQUIRED_MESSAGES: Partial<Record<RpFieldKey, string>> = {
  occurredAt: "Informe a data do relatório.",
  factoryId: "Escolha a fábrica.",
  problem: "Descreva o que ocorreu.",
  status: "Escolha o status.",
  memberIds: "Escolha pelo menos um técnico.",
};

function isEmpty(value: RpFormValues[RpFieldKey]): boolean {
  if (Array.isArray(value)) return value.length === 0;
  return typeof value === "string" && !value.trim();
}

function tooLong(text: string, max: number): string | null {
  const length = text.trim().length;
  return length > max ? `Passou do tamanho: ${length} caracteres (máximo ${max}).` : null;
}

function lengthErrors(values: RpFormValues): RpFormErrors {
  const errors: RpFormErrors = {};
  for (const key of SHORT_FIELDS) errors[key] = tooLong(values[key], SHORT_MAX) ?? undefined;
  for (const key of LONG_FIELDS) errors[key] = tooLong(values[key], LONG_MAX) ?? undefined;
  return errors;
}

/**
 * Erros do formulário público, um por campo, para mostrar logo abaixo dele. Vazio: pode gravar.
 * @example publicRpFormErrors({ ...valores, problem: "" }).problem // "Descreva o que ocorreu."
 */
export function publicRpFormErrors(values: RpFormValues): RpFormErrors {
  const errors = lengthErrors(values);
  for (const key of RP_REQUIRED_FIELDS) {
    if (isEmpty(values[key])) errors[key] = REQUIRED_MESSAGES[key];
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as RpFormErrors;
}
