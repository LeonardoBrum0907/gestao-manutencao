import type { RecordOrigin } from "@manutencao/shared";

// Origens que ficam fora de Registros, do Dashboard e das pendências da ficha do colaborador.
// Chamado tem tela própria (Turno › Chamados); o que sobra dele vira Tarefa.
// RP também: desde 2026-10-29 ele não cria problema (pedido do Léo), e os problemas espelho de antes saem de vista.
export const OUTSIDE_REGISTROS: readonly RecordOrigin[] = ["chamado", "rp"];

/**
 * Filtro do banco para o que aparece em Registros.
 * @example prisma.record.count({ where: { status: "open", ...inRegistros } })
 */
export const inRegistros = { origin: { notIn: [...OUTSIDE_REGISTROS] } };
