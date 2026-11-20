import type { RecordOrigin } from "@manutencao/shared";

// Origens que ficam fora de Registros, do Dashboard e das pendências da ficha do colaborador.
// Chamado tem tela própria (Turno › Chamados); o que sobra dele vira Tarefa.
// RP também: desde 2026-10-29 ele não cria problema (pedido do Léo), e os problemas espelho de antes saem de vista.
// Observação gravada na ficha do colaborador fica só na ficha (pedido do Léo, 2026-11-20).
export const OUTSIDE_REGISTROS: readonly RecordOrigin[] = ["chamado", "rp", "ficha"];

// O histórico de observações da ficha mostra os feedbacks da pessoa vindos de Registros e os da própria ficha.
const OUTSIDE_MEMBER_HISTORY: readonly RecordOrigin[] = ["chamado", "rp"];

/** Onde a lista de registros aparece: em Registros ou no histórico de observações da ficha. */
export type RecordScope = "registros" | "ficha";

/**
 * Filtro do banco para o que aparece em Registros.
 * @example prisma.record.count({ where: { status: "open", ...inRegistros } })
 */
export const inRegistros = { origin: { notIn: [...OUTSIDE_REGISTROS] } };

/**
 * Filtro do banco para a tela que pediu a lista.
 * @example prisma.record.findMany({ where: { AND: [scopeWhere("ficha"), { type: "feedback" }] } })
 */
export function scopeWhere(scope: RecordScope): { origin: { notIn: RecordOrigin[] } } {
  if (scope === "registros") return inRegistros;
  return { origin: { notIn: [...OUTSIDE_MEMBER_HISTORY] } };
}
