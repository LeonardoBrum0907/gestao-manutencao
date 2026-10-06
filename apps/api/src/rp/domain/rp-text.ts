import type { RpFourM, RpStatus } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

// Lê o texto do Relatório Padrão que circula no WhatsApp. Função pura: nunca grava nada e nunca
// falha por texto estranho, só devolve o que achou e uma lista de avisos para o gestor conferir.

type Field =
  | "date"
  | "line"
  | "tag"
  | "order"
  | "problem"
  | "description"
  | "repeated"
  | "material"
  | "machine"
  | "method"
  | "labor"
  | "rootCause"
  | "corrective"
  | "preventive"
  | "status"
  | "technicians"
  | "impact";

// Aliases sem acento e em maiúsculas; o mais longo de cada prefixo vem primeiro.
const ALIASES: [Field, string][] = [
  ["description", "DESCRICAO DO PROBLEMA"],
  ["impact", "IMPACTO EM CONDICAO BASICA"],
  ["corrective", "CONTRAMEDIDA CORRETIVA"],
  ["preventive", "CONTRAMEDIDA PREVENTIVA"],
  ["repeated", "FALHA REPETIDA"],
  ["rootCause", "CAUSA RAIZ"],
  ["labor", "MAO DE OBRA"],
  ["technicians", "EXECUTANTES"],
  ["technicians", "EXECUTANTE"],
  ["technicians", "TECNICOS"],
  ["technicians", "TECNICO"],
  ["description", "DESCRICAO"],
  ["problem", "PROBLEMA"],
  ["material", "MATERIAL"],
  ["machine", "MAQUINA"],
  ["method", "METODO"],
  ["status", "STATUS"],
  ["order", "ORDEM"],
  ["line", "LINHA"],
  ["date", "DATA"],
  ["tag", "TAG"],
  ["impact", "IMPACTO"],
];

const FOUR_M_FIELDS: Field[] = ["material", "machine", "method", "labor"];
const LONG_TEXT_FIELDS: Field[] = ["problem", "description", "rootCause", "corrective", "preventive", "impact"];

// Texto sem acento e em maiúsculas, com o mesmo comprimento do original (precisa estar em NFC).
function fold(text: string): string {
  let out = "";
  for (const char of text) {
    out += char.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  }
  return out;
}

function clean(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[⁠​-‏‪-‮﻿]/g, "")
    .replace(/[   ]/g, " ");
}

const MARKER = /[\s*_\-•·.–—]/;
const SEPARATOR = /^\s*[-_=*]{3,}\s*$/;

type LabelHit = { field: Field; valueStart: number };

function isPrompt(group: string): boolean {
  return /\?|PREENCHER|NECESSIDADE|COMO EVITAR/.test(group);
}

function matchLabel(line: string): LabelHit | null {
  const folded = fold(line);
  let i = 0;
  while (i < line.length && MARKER.test(line[i]!)) i++;
  for (const [field, alias] of ALIASES) {
    if (!folded.startsWith(alias, i)) continue;
    const after = folded[i + alias.length];
    if (after !== undefined && /[A-Z0-9]/.test(after)) continue;
    let j = i + alias.length;
    let confirmed = false;
    const skip = () => {
      while (j < line.length && /[\s*_]/.test(line[j]!)) j++;
    };
    skip();
    for (let step = 0; step < 3; step++) {
      const char = line[j];
      if (char === ":" || char === "?" || char === ".") {
        confirmed = true;
        j++;
        skip();
      } else if (char === "(") {
        const close = line.indexOf(")", j);
        if (close < 0 || !isPrompt(folded.slice(j, close))) break;
        confirmed = true;
        j = close + 1;
        skip();
      } else {
        break;
      }
    }
    if (!confirmed && j < line.length) continue;
    return { field, valueStart: j };
  }
  return null;
}

function isTitle(line: string): boolean {
  return /^[\s*_]*RELATORIO PADRAO\b/.test(fold(line));
}

function isFourMHeader(line: string): boolean {
  return /^[\s*_\-•]*4M\b/.test(fold(line));
}

// Separa vários relatórios colados juntos: por linha de traços ou por novo título.
function splitReports(lines: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let seenLabel = false;
  const flush = () => {
    if (current.some((line) => matchLabel(line))) chunks.push(current);
    current = [];
    seenLabel = false;
  };
  for (const line of lines) {
    if (SEPARATOR.test(line)) {
      flush();
      continue;
    }
    if (isTitle(line) && seenLabel) flush();
    if (matchLabel(line)) seenLabel = true;
    current.push(line);
  }
  flush();
  return chunks;
}

function stripBullet(line: string): string {
  return line.replace(/^[\s*_\-•·.–—]+/, "").trim();
}

function blockText(lines: string[]): string {
  return lines
    .map(stripBullet)
    .filter(Boolean)
    .join("\n");
}

const EMPTY_VALUES = new Set(["", "NA", "N/A", "N A", "NAO", "NADA", "-"]);

function isEmptyValue(text: string): boolean {
  return EMPTY_VALUES.has(fold(text).replace(/[\s.]+$/g, "").trim());
}

function orNull(text: string): string | null {
  const value = text.trim();
  return value ? value : null;
}

function parseDate(text: string): string | null {
  const match = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/.exec(text);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (match[3]!.length === 2) year += 2000;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function afterLabel(line: string, label: RegExp): string | null {
  const match = label.exec(fold(line));
  if (!match) return null;
  return line.slice(match.index + match[0].length).trim();
}

function parseRepeated(lines: string[]): { repeated: boolean; times: string | null; period: string | null } {
  let repeated = false;
  let times: string | null = null;
  let period: string | null = null;
  for (const line of lines) {
    const folded = fold(line);
    if (/\(\s*X\s*\)\s*SIM/.test(folded)) repeated = true;
    const asked = afterLabel(line, /QUANTAS VEZES\??\s*:?/);
    if (asked !== null && asked) times = asked;
    const range = afterLabel(line, /PERIODO APROXIMADO\s*:?/);
    if (range !== null && range) period = range;
  }
  return { repeated, times, period };
}

const STATUS_OPTIONS: [RegExp, RpStatus][] = [
  [/EM ANALISE/, "analysis"],
  [/MONITORAMENTO/, "monitoring"],
  [/CORRIGIDO/, "corrected"],
  [/PRODUZINDO/, "producing"],
];

function parseStatus(lines: string[]): RpStatus | null {
  for (const line of lines) {
    const folded = fold(line);
    const marked = /\(\s*X\s*\)\s*(.*)$/.exec(folded);
    if (!marked) continue;
    for (const [pattern, status] of STATUS_OPTIONS) {
      if (pattern.test(marked[1]!)) return status;
    }
  }
  return null;
}

function parseTechnicians(text: string): string[] {
  return text
    .split(/\s*(?:\n|,|;|\/|&|\+|\se\s)\s*/i)
    .map(stripBullet)
    .filter(Boolean);
}

export type ParsedRpCause = { marked: boolean; text: string | null };

export type ParsedRp = {
  date: string | null;
  orderNumber: string | null;
  line: string | null;
  tag: string | null;
  problem: string;
  description: string | null;
  repeatedFailure: boolean;
  repeatedTimes: string | null;
  repeatedPeriod: string | null;
  causes: Record<RpFourM, ParsedRpCause>;
  rootCause: string | null;
  corrective: string | null;
  preventive: string | null;
  status: RpStatus;
  basicConditionImpact: string | null;
  technicians: string[];
  rawText: string;
  warnings: string[];
};

function parseChunk(lines: string[]): ParsedRp {
  const values = new Map<Field, string[]>();
  let current: Field | null = null;
  let fourMSeen = false;
  const warnings: string[] = [];
  for (const line of lines) {
    if (isTitle(line)) {
      current = null;
      continue;
    }
    if (isFourMHeader(line)) {
      fourMSeen = true;
      current = null;
      continue;
    }
    const hit = matchLabel(line);
    const fourMAllowed = fourMSeen || current === null || current === "repeated" || (current !== null && FOUR_M_FIELDS.includes(current));
    if (hit && (!FOUR_M_FIELDS.includes(hit.field) || fourMAllowed) && !(current && LONG_TEXT_FIELDS.includes(current) && hit.field === current)) {
      current = hit.field;
      const rest = line.slice(hit.valueStart);
      values.set(hit.field, [...(values.get(hit.field) ?? []), rest]);
      continue;
    }
    if (current) values.get(current)!.push(line);
  }

  const text = (field: Field) => blockText(values.get(field) ?? []);
  const lineOf = (field: Field) => values.get(field) ?? [];
  const joined = (field: Field) => (values.get(field) ?? []).join("\n");

  const dateText = text("date");
  const date = parseDate(dateText);
  if (!date) warnings.push(dateText ? "Data inválida: confira a data." : "Data não encontrada: confira a data.");

  const repeated = parseRepeated(lineOf("repeated"));
  const causes = {} as Record<RpFourM, ParsedRpCause>;
  for (const key of ["material", "machine", "method", "labor"] as const) {
    const value = text(key);
    causes[key] = { marked: !isEmptyValue(value), text: isEmptyValue(value) ? null : value };
  }

  const status = parseStatus(lineOf("status"));
  if (!status) warnings.push("Status não marcado: ficou em análise.");

  const problem = text("problem");
  if (!problem) warnings.push("Não encontrei o problema: preencha antes de salvar.");

  const impact = text("impact");
  const technicians = parseTechnicians(joined("technicians"));
  if (!technicians.length) warnings.push("Técnico não informado.");

  return {
    date,
    orderNumber: orNull(text("order")),
    line: orNull(text("line")),
    tag: orNull(text("tag")),
    problem,
    description: orNull(text("description")),
    repeatedFailure: repeated.repeated,
    repeatedTimes: repeated.times,
    repeatedPeriod: repeated.period,
    causes,
    rootCause: orNull(text("rootCause")),
    corrective: orNull(text("corrective")),
    preventive: orNull(text("preventive")),
    status: status ?? "analysis",
    basicConditionImpact: isEmptyValue(impact) ? null : impact,
    technicians,
    rawText: lines.join("\n").trim(),
    warnings,
  };
}

export const RP_TEXT_MAX_LENGTH = 20_000;

export function parseRpText(input: string): ParsedRp[] {
  if (input.length > RP_TEXT_MAX_LENGTH * 10) {
    throw new DomainError("invalid", 400, "O texto é grande demais.");
  }
  const lines = clean(input).split("\n");
  const reports = splitReports(lines).map(parseChunk);
  if (!reports.length) {
    throw new DomainError("rp_not_found", 400, "Não encontrei um Relatório Padrão nesse texto.");
  }
  return reports;
}
