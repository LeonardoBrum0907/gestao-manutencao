import {
  isTechCardType,
  TECH_CARD_DETAIL_FIELDS,
  TECH_CARD_TYPES,
  type TechCardFields,
  type TechCardScope,
  type TechCardType,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { isRecord, optionalString, requiredString } from "../../kernel/parse";

const TITLE_MAX = 200;
const TAGS_MAX = 20;
const PAGE_MAX = 100_000;

// Tipos em que o código é o que o técnico digita na busca: sem ele a ficha não serve.
const CODE_REQUIRED: readonly TechCardType[] = ["error_code", "part"];

function invalid(message: string): DomainError {
  return new DomainError("invalid", 400, message);
}

function readType(source: Record<string, unknown>): TechCardType {
  const value = requiredString(source, "type", `Informe o tipo da ficha: ${TECH_CARD_TYPES.join(", ")}.`);
  if (!isTechCardType(value)) throw invalid(`Tipo "${value}" não existe. Use um de: ${TECH_CARD_TYPES.join(", ")}.`);
  return value;
}

/**
 * Para quem a ficha vale: um modelo, uma máquina ou uma linha, e só um deles.
 * @example readScope({ machineId: "m1" }) // { equipmentId: null, machineId: "m1", lineId: null }
 */
export function readScope(source: Record<string, unknown>): TechCardScope {
  const scope = {
    equipmentId: optionalString(source, "equipmentId"),
    machineId: optionalString(source, "machineId"),
    lineId: optionalString(source, "lineId"),
  };
  const filled = Object.values(scope).filter(Boolean).length;
  if (filled !== 1) {
    throw invalid("A ficha vale para um modelo (equipmentId), uma máquina (machineId) ou uma linha (lineId): informe exatamente um deles.");
  }
  return scope;
}

/**
 * Campos próprios do tipo, só os que existem para ele e com texto; chave desconhecida é erro para a IA corrigir.
 * @example readDetails("part", { quantity: "3", unit: "ST" }) // { quantity: "3", unit: "ST" }
 */
export function readDetails(type: TechCardType, value: unknown): Record<string, string> {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) throw invalid("details precisa ser um objeto de textos.");
  const allowed = TECH_CARD_DETAIL_FIELDS[type].map((field) => field.key);
  const details: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!allowed.includes(key)) throw invalid(`Campo "${key}" não existe no tipo ${type}. Campos: ${allowed.join(", ")}.`);
    if (raw === null || raw === undefined || raw === "") continue;
    if (typeof raw !== "string") throw invalid(`Campo "${key}" precisa ser texto.`);
    if (raw.trim()) details[key] = raw.trim();
  }
  return details;
}

/**
 * Etiquetas livres: texto, sem repetição e sem vazias.
 * @example readTags(["Rede", " rede ", ""]) // ["Rede"]
 */
export function readTags(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) throw invalid("tags precisa ser uma lista de textos.");
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const tag of value.map((item: string) => item.trim()).filter(Boolean)) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  if (tags.length > TAGS_MAX) throw invalid(`No máximo ${TAGS_MAX} etiquetas.`);
  return tags;
}

function readPage(source: Record<string, unknown>, documentId: string | null): number | null {
  const value = source.page;
  if (value === undefined || value === null || value === "") return null;
  const page = typeof value === "string" ? Number(value) : value;
  if (typeof page !== "number" || !Number.isInteger(page) || page < 1 || page > PAGE_MAX) {
    throw invalid(`Página inválida (${String(value)}): use um inteiro a partir de 1.`);
  }
  if (!documentId) throw invalid("A página precisa do documento (documentId).");
  return page;
}

function readCode(source: Record<string, unknown>, type: TechCardType): string | null {
  const code = optionalString(source, "code");
  if (!code && CODE_REQUIRED.includes(type)) {
    throw invalid(type === "part" ? "Informe o nº da peça (code)." : "Informe o código do erro ou alarme (code).");
  }
  return code;
}

function readTitle(source: Record<string, unknown>): string {
  const title = requiredString(source, "title", "Informe o título da ficha.");
  if (title.length > TITLE_MAX) throw invalid(`Título com ${title.length} caracteres; o máximo é ${TITLE_MAX}.`);
  return title;
}

/**
 * Lê e valida o corpo de uma ficha (tela ou MCP). Erros dizem o campo e o formato esperado.
 * @example readTechCardFields({ type: "part", equipmentId: "e1", code: "938580", title: "Servomotor" })
 */
export function readTechCardFields(source: Record<string, unknown>): TechCardFields {
  const type = readType(source);
  const documentId = optionalString(source, "documentId");
  return {
    type,
    ...readScope(source),
    subassemblyId: optionalString(source, "subassemblyId"),
    code: readCode(source, type),
    title: readTitle(source),
    summary: optionalString(source, "summary") ?? "",
    details: readDetails(type, source.details),
    deviceTag: optionalString(source, "deviceTag"),
    originalTerm: optionalString(source, "originalTerm"),
    tags: readTags(source.tags),
    documentId,
    page: readPage(source, documentId),
    sheet: optionalString(source, "sheet"),
    reviewNeeded: source.reviewNeeded === true,
  };
}
