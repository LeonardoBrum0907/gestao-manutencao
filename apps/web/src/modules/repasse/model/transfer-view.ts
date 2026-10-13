import { GESTOR_TIME_ZONE, type TransferGapDto, type TransferProgressDto, type TransferSummaryDto } from "@manutencao/shared";

// Regras de exibição do repasse, fora dos componentes para terem teste.

const DAY_MS = 24 * 60 * 60 * 1000;
const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

function dayNumber(date: Date): number {
  return Date.parse(`${dayFormat.format(date)}T00:00:00Z`) / DAY_MS;
}

/**
 * Há quanto tempo, contado em dias de Brasília: "hoje", "ontem" ou "há N dias".
 * @example daysAgoLabel("2026-10-02T12:00:00Z", new Date("2026-10-12T12:00:00Z")) // "há 10 dias"
 */
export function daysAgoLabel(iso: string, now = new Date()): string {
  const days = Math.max(0, dayNumber(now) - dayNumber(new Date(iso)));
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

/**
 * Data curta no fuso do gestor.
 * @example shortDate("2026-10-12T15:00:00Z") // "12/10/2026"
 */
export function shortDate(iso: string): string {
  const [year, month, day] = dayFormat.format(new Date(iso)).split("-");
  return `${day}/${month}/${year}`;
}

/**
 * "26 de 46": quantas já faz das que quem ensina domina.
 * @example progressLabel({ mastered: 46, done: 26, near: 12, fromZero: 8, percent: 57 }) // "26 de 46"
 */
export function progressLabel(progress: Pick<TransferProgressDto, "done" | "mastered">): string {
  return `${progress.done} de ${progress.mastered}`;
}

/**
 * Primeiro nome, para dentro da tela do par, onde as duas pessoas já estão no título.
 * @example firstName("Renato Crispin Vitorino") // "Renato"
 */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/**
 * Nome e sobrenome, para frases curtas. Só o primeiro nome não basta: há três Paulos entre os técnicos.
 * @example shortName("Renato Crispin Vitorino") // "Renato Crispin"
 */
export function shortName(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).join(" ");
}

/**
 * Faixa da lista: a equipe de quem aprende.
 * @example transferGroup({ learner: { teamName: null } }) // { key: "", title: "Sem equipe" }
 */
export function transferGroup(transfer: { learner: Pick<TransferSummaryDto["learner"], "teamName"> }): { key: string; title: string } {
  const name = transfer.learner.teamName;
  return { key: name ?? "", title: name ?? "Sem equipe" };
}

export const GAP_FILTERS = ["all", "zero", "near"] as const;
export type GapFilter = (typeof GAP_FILTERS)[number];

/**
 * Perto = nota 2; do zero = o resto.
 * @example isNear({ learnerScore: 2 }) // true
 */
export function isNear(gap: Pick<TransferGapDto, "learnerScore">): boolean {
  return gap.learnerScore === 2;
}

/**
 * Filtro do "Falta repassar".
 * @example filterGaps(gaps, "near").every(isNear) // true
 */
export function filterGaps(gaps: readonly TransferGapDto[], filter: GapFilter): TransferGapDto[] {
  if (filter === "near") return gaps.filter(isNear);
  if (filter === "zero") return gaps.filter((gap) => !isNear(gap));
  return [...gaps];
}

/**
 * Título do item de PDI criado pelo "+ PDI": o texto da habilidade (o item já guarda a habilidade e o padrinho).
 * @example pdiTitle({ text: "Trocar formato" }) // "Trocar formato"
 */
export function pdiTitle(gap: Pick<TransferGapDto, "text">): string {
  return gap.text;
}
