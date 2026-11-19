import type { PublicRpDirectoryDto } from "@manutencao/shared";
import type { RpFormValues } from "../../rp/model/rp";
import { requiredFieldErrors, type RpFieldKey, type RpFormErrors } from "../../rp/model/rp-required";

// Os mesmos limites que a API confere (apps/api/src/rp-publico/application/parse-public-rp.ts): a tela avisa
// embaixo de cada campo antes de mandar, e o servidor continua sendo a última palavra.
const SHORT_MAX = 120;
const LONG_MAX = 2000;
const SHORT_FIELDS = ["orderNumber", "line", "tag", "repeatedTimes", "repeatedPeriod"] as const;
const LONG_FIELDS = ["problem", "description", "rootCause", "corrective", "preventive", "basicConditionImpact"] as const;

export type { RpFieldKey, RpFormErrors };

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

type DirectoryMachine = PublicRpDirectoryDto["machines"][number];

/**
 * A máquina só é obrigatória quando a linha é do cadastro e tem máquina para escolher; linha escrita à mão não tem lista.
 * @example machineRequired({ ...valores, lineId: "l1" }, directory.machines) // true se a linha l1 tem máquina
 */
export function machineRequired(values: RpFormValues, machines: DirectoryMachine[]): boolean {
  return Boolean(values.lineId) && machines.some((machine) => machine.lineId === values.lineId);
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
  const errors = { ...lengthErrors(values), ...requiredFieldErrors(values, RP_REQUIRED_FIELDS) };
  if (machineRequired(values, machines) && !values.machineId) errors.machineId = "Escolha a máquina.";
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as RpFormErrors;
}
