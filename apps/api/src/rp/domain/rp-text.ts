import { basicConditionAnswer, type RpFourM, type RpStatus } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { causeDetail } from "./rp-cause";
import { gestorToday, readRpDate } from "./rp-date";
import { afterMarkedBox, leadingBox } from "./rp-marks";

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
  ["technicians", "TECNICOS RESPONSAVEIS"],
  ["technicians", "TECNICO RESPONSAVEL"],
  ["technicians", "EXECUTADO POR"],
  ["technicians", "EXECUTANTES"],
  ["technicians", "EXECUTANTE"],
  ["technicians", "MANUTENTORES"],
  ["technicians", "RESPONSAVEIS"],
  ["technicians", "RESPONSAVEL"],
  ["technicians", "TECNICO(S)"],
  ["technicians", "TECNICOS"],
  ["technicians", "TECNICO"],
  ["order", "ORDEM DE SERVICO"],
  ["description", "DESCRICAO"],
  ["problem", "PROBLEMA"],
  ["material", "MATERIAL"],
  ["machine", "MAQUINA"],
  ["method", "METODO"],
  ["status", "STATUS"],
  ["order", "ORDEM"],
  ["order", "Nº OS"],
  ["order", "N° OS"],
  ["order", "O.S"],
  ["order", "OS"],
  ["line", "LINHA"],
  ["date", "DATA"],
  ["tag", "TAG"],
  ["impact", "IMPACTO"],
];

// "MÃO DE  OBRA" com dois espaços (MED 04, 2026-10-31) não casava e o texto ia parar no MÉTODO.
const ALIAS_PATTERNS: [Field, RegExp][] = ALIASES.map(([field, alias]) => [
  field,
  new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"), "y"),
]);

const FOUR_M_FIELDS: Field[] = ["material", "machine", "method", "labor"];
// Campos de uma linha só. O modelo do Renan (desde 2026-11-01) escreve "*LINHA* CAM 6", sem dois-pontos: para
// eles, o negrito fechado logo depois do nome ou um traço ("LINHA - MED 06") também confirmam o rótulo.
const SHORT_FIELDS: Field[] = ["date", "line", "tag", "order", "technicians"];
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

// "(o que foi observado)" às vezes vem sem "?": as perguntas do modelo começam com O QUE, POR QUE ou COMO.
function isPrompt(group: string): boolean {
  return /\?|PREENCHER|NECESSIDADE|COMO EVITAR|^\(\s*(O QUE|POR QUE|COMO)\b/.test(group);
}

// "*(o que ocorreu?):*" sozinho na linha de baixo do rótulo: é a pergunta do modelo, não o valor.
function isPromptLine(line: string): boolean {
  const bare = fold(line).replace(/^[\s*_]+|[\s*_:.]+$/g, "");
  const inner = /^(\([^()]*)\)$/.exec(bare);
  return inner !== null && isPrompt(inner[1]!);
}

type LabelEnd = { end: number; confirmed: boolean };

function skipBlanks(line: string, from: number): number {
  let j = from;
  while (j < line.length && /[\s*_]/.test(line[j]!)) j++;
  return j;
}

// Depois do nome do rótulo: aceita até três ':', '?', '.' ou '(pergunta do modelo)' e diz onde começa o valor.
function readLabelEnd(line: string, folded: string, start: number): LabelEnd {
  let j = skipBlanks(line, start);
  let confirmed = false;
  for (let step = 0; step < 3; step++) {
    const char = line[j];
    if (char === ":" || char === "?" || char === ".") {
      j = skipBlanks(line, j + 1);
    } else if (char === "(") {
      const close = line.indexOf(")", j);
      if (close < 0 || !isPrompt(folded.slice(j, close))) break;
      j = skipBlanks(line, close + 1);
    } else {
      break;
    }
    confirmed = true;
  }
  return { end: j, confirmed };
}

function matchLabel(line: string): LabelHit | null {
  const folded = fold(line);
  let i = 0;
  while (i < line.length && MARKER.test(line[i]!)) i++;
  for (const [field, pattern] of ALIAS_PATTERNS) {
    pattern.lastIndex = i;
    const found = pattern.exec(folded);
    if (!found) continue;
    const aliasEnd = i + found[0].length;
    const after = folded[aliasEnd];
    if (after !== undefined && /[A-Z0-9]/.test(after)) continue;
    const { end, confirmed } = readLabelEnd(line, folded, aliasEnd);
    if (confirmed || end >= line.length) return { field, valueStart: end };
    const shortEnd = SHORT_FIELDS.includes(field) ? readShortLabelEnd(line, aliasEnd, end) : null;
    if (shortEnd !== null) return { field, valueStart: shortEnd };
  }
  return null;
}

// "*LINHA* CAM 6" ou "LINHA - MED 06": só para os campos de uma linha, onde não há frase solta para confundir.
function readShortLabelEnd(line: string, aliasEnd: number, end: number): number | null {
  if (line.slice(aliasEnd, end).includes("*")) return end;
  const dash = /^[-–]\s+/.exec(line.slice(end));
  return dash ? end + dash[0].length : null;
}

// "RELATÓRIO PADRÃO – MANUTENÇÃO", "RELATÓRIO  MANUTENÇÃO", "RELATÓRIO DE MANUTENÇÃO" e "O *RELATÓRIO PADRÃO".
function isTitle(line: string): boolean {
  return /^[\s*_]*(O\s+)?[\s*_]*RELATORIO\s+(PADRAO|DE\s+MANUTENCAO|MANUTENCAO)\b/.test(fold(line));
}

function isFourMHeader(line: string): boolean {
  return /^[\s*_\-•]*4M\b/.test(fold(line));
}

// Separa vários relatórios colados juntos: por linha de traços ou por novo título.
function splitReports(lines: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let seenLabel = false;
  let seenDate = false;
  const flush = () => {
    if (current.some((line) => matchLabel(line))) chunks.push(current);
    current = [];
    seenLabel = false;
    seenDate = false;
  };
  for (const line of lines) {
    if (SEPARATOR.test(line)) {
      flush();
      continue;
    }
    const hit = matchLabel(line);
    // Dois relatórios colados sem título nem traços: uma segunda DATA começa o próximo.
    if ((isTitle(line) && seenLabel) || (hit?.field === "date" && seenDate)) flush();
    if (hit) seenLabel = true;
    if (hit?.field === "date") seenDate = true;
    current.push(line);
  }
  flush();
  return chunks;
}

type BoxedCause = { field: Field; marked: boolean; value: string };

// Modelo do Renan (desde 2026-11-01): o 4M vem com quadrinho na frente, "(X) *MÁQUINA*" e "() *MATERIAL*".
// Antes o leitor não via o rótulo atrás do quadrinho e nenhuma causa saía marcada.
function boxedCause(line: string): BoxedCause | null {
  const box = leadingBox(line);
  if (!box) return null;
  const hit = matchLabel(box.rest);
  if (!hit || !FOUR_M_FIELDS.includes(hit.field)) return null;
  const detail = box.rest.slice(hit.valueStart).trim();
  return { field: hit.field, marked: box.marked, value: box.marked ? `X ${detail}` : "" };
}

function stripBullet(line: string): string {
  return line.replace(/^[\s*_\-•·.–—]+/, "").trim();
}

function blockText(lines: string[]): string {
  return lines
    .filter((line) => !isPromptLine(line))
    .map(stripBullet)
    .filter(Boolean)
    .join("\n");
}

// "Não se aplica." no 4M marcava a causa (MEDISEAL 02 e CAM 05) e "____" do modelo virava o período.
const EMPTY_VALUES = new Set(["", "NA", "N/A", "N A", "NAO", "NADA", "-", "NAO SE APLICA", "NAO APLICA"]);

function isEmptyValue(text: string): boolean {
  const bare = fold(text).replace(/[\s.]+$/g, "").trim();
  return EMPTY_VALUES.has(bare) || /^_+$/.test(bare);
}

function orNull(text: string): string | null {
  const value = text.trim();
  return value ? value : null;
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
    if (asked !== null && !isEmptyValue(asked)) times = asked;
    const range = afterLabel(line, /PERIODO APROXIMADO\s*:?/);
    if (range !== null && !isEmptyValue(range)) period = range;
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

function parseChunk(lines: string[], today: string): ParsedRp {
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
    const boxed = boxedCause(line);
    if (boxed) {
      // Quadrinho vazio: as linhas de baixo não são detalhe desta causa.
      current = boxed.marked ? boxed.field : null;
      values.set(boxed.field, [...(values.get(boxed.field) ?? []), boxed.value]);
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
  // Linha, TAG e ordem cabem numa linha: o que vem embaixo sem rótulo conhecido não é deles.
  const firstLine = (field: Field) => text(field).split("\n")[0] ?? "";

  const dateText = text("date");
  const { date, guessedYear } = readRpDate(dateText, today);
  if (!date) warnings.push(dateText ? "Data inválida: confira a data." : "Data não encontrada: confira a data.");
  if (guessedYear) warnings.push(`Data sem ano: usei ${date!.slice(0, 4)}. Confira a data.`);

  const repeated = parseRepeated(lineOf("repeated"));
  const causes = {} as Record<RpFourM, ParsedRpCause>;
  for (const key of ["material", "machine", "method", "labor"] as const) {
    const value = text(key);
    causes[key] = isEmptyValue(value) ? { marked: false, text: null } : { marked: true, text: causeDetail(value) };
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
    orderNumber: isEmptyValue(firstLine("order")) ? null : firstLine("order"),
    line: orNull(firstLine("line")),
    tag: orNull(firstLine("tag")),
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
    // Sim/Não desde 2026-10-31: "não" e "N/A" deixaram de ser vazio e viram "Não" (ver rp-basic-condition no shared).
    basicConditionImpact: basicConditionAnswer(impact) ?? (isEmptyValue(impact) ? null : impact),
    technicians,
    rawText: lines.join("\n").trim(),
    warnings,
  };
}

export const RP_TEXT_MAX_LENGTH = 20_000;

/**
 * Lê um ou mais Relatórios Padrão colados do WhatsApp. `today` (AAAA-MM-DD, fuso do gestor) completa a data sem ano.
 * @example parseRpText("*DATA* 18/11\n*LINHA* MED 06\n*PROBLEMA:* x", "2026-11-19")[0].date // "2026-11-18"
 */
export function parseRpText(input: string, today: string = gestorToday()): ParsedRp[] {
  if (input.length > RP_TEXT_MAX_LENGTH * 10) {
    throw new DomainError("invalid", 400, "O texto é grande demais.");
  }
  const lines = clean(input).split("\n");
  const reports = splitReports(lines).map((chunk) => parseChunk(chunk, today));
  if (!reports.length) {
    throw new DomainError("rp_not_found", 400, "Não encontrei um Relatório Padrão nesse texto.");
  }
  return reports;
}
