import type { RecordOrigin } from "@manutencao/shared";

// Origens que ficam fora de Registros, do Dashboard e das pendências da ficha do colaborador.
// Chamado tem tela própria (Turno › Chamados); o que sobra dele vira Tarefa.
// RP também: desde 2026-10-29 ele não cria problema (pedido do Léo), e os problemas espelho de antes saem de vista.
// Feedback gravado na ficha do colaborador fica só na ficha (pedido do Léo, 2026-11-20).
export const OUTSIDE_REGISTROS: readonly RecordOrigin[] = ["chamado", "rp", "ficha"];

/**
 * Onde a lista de registros aparece: em Registros (e no cartão Observações da ficha, que lê os de Registros)
 * ou no cartão Feedbacks da ficha, que só tem o que foi gravado nela.
 */
export type RecordScope = "registros" | "ficha";

/**
 * Filtro do banco para o que aparece em Registros.
 * @example prisma.record.count({ where: { status: "open", ...inRegistros } })
 */
export const inRegistros = { origin: { notIn: [...OUTSIDE_REGISTROS] } };

/** Filtro do banco para os feedbacks gravados na ficha do colaborador. */
export const inMemberFeedbacks = { origin: "ficha" } as const;

/**
 * Filtro do banco para a tela que pediu a lista.
 * @example prisma.record.findMany({ where: { AND: [scopeWhere("ficha"), { type: "feedback" }] } })
 */
export function scopeWhere(scope: RecordScope): typeof inRegistros | typeof inMemberFeedbacks {
  return scope === "registros" ? inRegistros : inMemberFeedbacks;
}
