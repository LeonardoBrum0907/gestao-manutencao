import type { RpCauseDto, RpFourM, RpStatus } from "./index";

// Texto do Relatório Padrão no mesmo modelo que o time cola no grupo do WhatsApp. O leitor do app
// (apps/api/src/rp/domain/rp-text.ts) lê este texto de volta com os mesmos campos: o spec de ida e volta
// fica lá, ao lado do leitor.

/** O que entra no texto. Linha e técnicos já vêm como nomes: quem chama resolve os ids. */
export type RpWhatsappInput = {
  occurredAt: string;
  line: string | null;
  tag: string | null;
  orderNumber: string | null;
  problem: string;
  description: string | null;
  repeatedFailure: boolean;
  repeatedTimes: string | null;
  repeatedPeriod: string | null;
  causes: Record<RpFourM, RpCauseDto>;
  rootCause: string | null;
  corrective: string | null;
  preventive: string | null;
  status: RpStatus;
  technicians: string[];
  basicConditionImpact: string | null;
};

const WHATSAPP_STATUS_OPTIONS: [RpStatus, string][] = [
  ["analysis", "Em análise"],
  ["corrected", "Corrigido"],
  ["monitoring", "Em monitoramento"],
  ["producing", "Produzindo"],
];

const WHATSAPP_FOUR_M: [RpFourM, string][] = [
  ["material", "MATERIAL"],
  ["machine", "MÁQUINA"],
  ["method", "MÉTODO"],
  ["labor", "MÃO DE OBRA"],
];

// O dia do RP fica ao meio-dia UTC: os 10 primeiros caracteres já são o dia certo.
function whatsappDay(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function bulletLines(text: string | null): string[] {
  // Quem já escreveu com "-" ou "•" não ganha marcador dobrado.
  const lines = (text ?? "").split("\n").map((line) => line.trim().replace(/^[-•]\s*/, "")).filter(Boolean);
  return lines.length ? lines.map((line) => `- ${line}`) : ["- "];
}

function longSection(label: string, text: string | null): string[] {
  return [`*${label}:*`, ...bulletLines(text), ""];
}

function repeatedSection(input: RpWhatsappInput): string[] {
  const mark = (on: boolean) => (on ? "(X)" : "( )");
  return [
    "*FALHA REPETIDA?*",
    `${mark(!input.repeatedFailure)} Não`,
    `${mark(input.repeatedFailure)} Sim → Quantas vezes? ${input.repeatedFailure ? input.repeatedTimes ?? "" : ""}`.trimEnd(),
    `Período aproximado: ${input.repeatedFailure ? input.repeatedPeriod ?? "" : ""}`.trimEnd(),
    "",
  ];
}

// Causa marcada vira "X" e o detalhe vai entre parênteses, como o time escreve: "MÁQUINA: X (FERRAMENTAL)".
function causeValue(cause: RpCauseDto): string {
  if (!cause.marked) return "";
  return cause.text ? `X (${cause.text})` : "X";
}

function fourMSection(causes: Record<RpFourM, RpCauseDto>): string[] {
  const lines = WHATSAPP_FOUR_M.map(([key, label]) => `- *${label}:* ${causeValue(causes[key])}`.trimEnd());
  return ["*4M – POSSÍVEIS CAUSAS*", ...lines, ""];
}

function statusSection(status: RpStatus): string[] {
  const lines = WHATSAPP_STATUS_OPTIONS.map(([key, label]) => `${key === status ? "(X)" : "( )"} ${label}`);
  return ["*STATUS:*", ...lines, ""];
}

function headerSection(input: RpWhatsappInput): string[] {
  return [
    "*RELATÓRIO PADRÃO – MANUTENÇÃO*",
    "",
    `*DATA:* ${whatsappDay(input.occurredAt)}`,
    `*LINHA:* ${input.line ?? ""}`.trimEnd(),
    `*TAG:* ${input.tag ?? ""}`.trimEnd(),
    `*ORDEM:* ${input.orderNumber ?? ""}`.trimEnd(),
    "",
  ];
}

/**
 * Monta o texto do RP para colar no grupo do WhatsApp, na ordem e com os rótulos do modelo do time.
 * @example rpWhatsappText({ ...rp, line: "Cam 08", technicians: ["Rogério B"] }) // "*RELATÓRIO PADRÃO – MANUTENÇÃO*\n\n*DATA:* 04/10/2026…"
 */
export function rpWhatsappText(input: RpWhatsappInput): string {
  return [
    ...headerSection(input),
    ...longSection("PROBLEMA (o que ocorreu?)", input.problem),
    ...longSection("DESCRIÇÃO DO PROBLEMA (o que foi observado?)", input.description),
    ...repeatedSection(input),
    ...fourMSection(input.causes),
    ...longSection("CAUSA RAIZ (por que aconteceu?)", input.rootCause),
    ...longSection("CONTRAMEDIDA CORRETIVA (o que foi feito agora?)", input.corrective),
    ...longSection("CONTRAMEDIDA PREVENTIVA (como evitar repetir?)", input.preventive),
    ...statusSection(input.status),
    `*TÉCNICO:* ${input.technicians.join(", ")}`.trimEnd(),
    "",
    `*IMPACTO EM CONDIÇÃO BÁSICA?* ${input.basicConditionImpact ?? ""}`.trimEnd(),
  ].join("\n");
}
