import type { PublicRpFields, RpDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalBoolean, readObject } from "../../kernel/parse";
import { parseRp, type RpInput } from "../../rp/application/parse-rp";

const PUBLIC_KEYS: readonly (keyof PublicRpFields)[] = [
  "occurredAt", "orderNumber", "factoryId", "lineId", "line", "tag", "machineId", "problem", "description",
  "repeatedFailure", "repeatedTimes", "repeatedPeriod", "causes", "rootCause", "corrective", "preventive", "status",
  "basicConditionImpact", "memberIds",
];

const SHORT_MAX = 120;
const LONG_MAX = 2000;
const SHORT_FIELDS = { orderNumber: "Ordem", line: "Linha", tag: "TAG", repeatedTimes: "Quantas vezes", repeatedPeriod: "Período" } as const;
const LONG_FIELDS = {
  problem: "Problema", description: "Descrição", rootCause: "Causa raiz", corrective: "Contramedida corretiva",
  preventive: "Contramedida preventiva", basicConditionImpact: "Impacto em condição básica",
} as const;

export type PublicRpInput = { input: RpInput; revised: boolean };

function pickPublic(source: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(PUBLIC_KEYS.filter((key) => key in source).map((key) => [key, source[key]]));
}

function assertLength(value: string | null, label: string, max: number): void {
  if (value && value.length > max) {
    throw new DomainError("too_long", 400, `${label} passou do tamanho (recebido: ${value.length} caracteres; máximo: ${max}).`);
  }
}

function assertLimits(input: RpInput): void {
  const { fields } = input;
  for (const [key, label] of Object.entries(SHORT_FIELDS)) assertLength(fields[key as keyof typeof SHORT_FIELDS], label, SHORT_MAX);
  for (const [key, label] of Object.entries(LONG_FIELDS)) assertLength(fields[key as keyof typeof LONG_FIELDS], label, LONG_MAX);
  for (const cause of Object.values(fields.causes)) assertLength(cause.text, "Texto do 4M", LONG_MAX);
}

/**
 * Lê campos públicos (do formulário ou de uma versão do histórico) e completa com o que só o coordenador mexe:
 * o subconjunto fica se a máquina não mudou, os nomes fora do cadastro e o texto colado ficam como estavam.
 * @example toRpInput(publicFields, rpAtual).fields.subassemblyId
 */
export function toRpInput(raw: Record<string, unknown>, current: RpDto | null): RpInput {
  const input = parseRp({ ...pickPublic(raw), rawText: current?.rawText ?? "" });
  const keepSubassembly = current && current.machineId === input.fields.machineId ? current.subassemblyId : null;
  return {
    ...input,
    chamadoId: null,
    fields: { ...input.fields, subassemblyId: keepSubassembly, unmatchedTechnicians: current?.unmatchedTechnicians ?? null },
  };
}

function assertMembers(memberIds: string[], allowed: ReadonlySet<string>): void {
  if (!memberIds.length) throw new DomainError("member", 400, "Escolha pelo menos um técnico.");
  const outside = memberIds.find((id) => !allowed.has(id));
  if (outside) {
    throw new DomainError("member", 400, `Técnico não liberado para a página pública (recebido: ${outside}). Peça ao coordenador para liberar.`);
  }
}

/**
 * Corpo do POST/PATCH público. `allowed`: técnicos liberados (mais os que o RP já tinha, ao editar).
 * O campo-isca `website` cheio é robô: recusa sem dizer por quê.
 * @example parsePublicRp(body, new Set(["m1"]), null).input.fields.memberIds // ["m1"]
 */
export function parsePublicRp(body: unknown, allowed: ReadonlySet<string>, current: RpDto | null): PublicRpInput {
  const source = readObject(body);
  if (typeof source.website === "string" && source.website.trim()) {
    throw new DomainError("invalid", 400, "Não foi possível gravar o relatório.");
  }
  const input = toRpInput(source, current);
  assertLimits(input);
  assertMembers(input.fields.memberIds, allowed);
  return { input, revised: optionalBoolean(source, "revised") };
}

const REVIEW_MAX = 1000;

/**
 * O que o supervisor pede para revisar.
 * @example parseReviewRequest({ text: "Faltou a causa raiz" }) // "Faltou a causa raiz"
 */
export function parseReviewRequest(body: unknown): string {
  const source = readObject(body);
  const text = typeof source.text === "string" ? source.text.trim() : "";
  if (!text) throw new DomainError("invalid", 400, "Escreva o que precisa revisar.");
  assertLength(text, "O pedido de revisão", REVIEW_MAX);
  return text;
}
