import type { PublicRpDirectoryDto } from "@manutencao/shared";
import type { RpFormValues } from "../../rp/model/rp";

// Os mesmos limites que a API confere (apps/api/src/rp-publico/application/parse-public-rp.ts): a tela avisa
// embaixo de cada campo antes de mandar, e o servidor continua sendo a última palavra.
const SHORT_MAX = 120;
const LONG_MAX = 2000;
const SHORT_FIELDS = ["orderNumber", "line", "tag", "repeatedTimes", "repeatedPeriod"] as const;
const LONG_FIELDS = ["problem", "description", "rootCause", "corrective", "preventive", "basicConditionImpact"] as const;

export type RpFieldKey = keyof RpFormValues;
export type RpFormErrors = Partial<Record<RpFieldKey, string>>;

// O técnico preenche o RP inteiro pela página pública (pedido do Léo, 2026-10-19); o 4M e a ordem continuam opcionais.
// "line" é o nome da linha: vem do cadastro ao escolher a linha ou é escrito à mão em "Outra linha".
/** Campos que o RP da página pública não grava sem. A máquina tem regra própria: ver publicRpFormErrors. */
export const RP_REQUIRED_FIELDS: readonly RpFieldKey[] = [
  "occurredAt",
  "factoryId",
  "line",
  "tag",
  "problem",
  "description",
  "rootCause",
  "corrective",
  "preventive",
  "status",
  "basicConditionImpact",
  "memberIds",
];

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

type DirectoryMachine = PublicRpDirectoryDto["machines"][number];

/**
 * A máquina só é obrigatória quando a linha é do cadastro e tem máquina para escolher; linha escrita à mão não tem lista.
 * @example machineRequired({ ...valores, lineId: "l1" }, directory.machines) // true se a linha l1 tem máquina
 */
export function machineRequired(values: RpFormValues, machines: DirectoryMachine[]): boolean {
  return Boolean(values.lineId) && machines.some((machine) => machine.lineId === values.lineId);
}

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
 * @example publicRpFormErrors({ ...valores, problem: "" }, directory.machines).problem // "Descreva o que ocorreu."
 */
export function publicRpFormErrors(values: RpFormValues, machines: DirectoryMachine[]): RpFormErrors {
  const errors = lengthErrors(values);
  for (const key of RP_REQUIRED_FIELDS) {
    if (isEmpty(values[key])) errors[key] = REQUIRED_MESSAGES[key];
  }
  if (machineRequired(values, machines) && !values.machineId) errors.machineId = "Escolha a máquina.";
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as RpFormErrors;
}
