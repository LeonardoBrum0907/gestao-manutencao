import type { RecordOrigin } from "@manutencao/shared";

// Origens que ficam fora de Registros, do Dashboard e das pendências da ficha do colaborador.
// Chamado tem tela própria (Turno › Chamados); o que sobra dele vira Tarefa.
export const OUTSIDE_REGISTROS: readonly RecordOrigin[] = ["chamado"];

/**
 * Filtro do banco para o que aparece em Registros.
 * @example prisma.record.count({ where: { status: "open", ...inRegistros } })
 */
export const inRegistros = { origin: { notIn: [...OUTSIDE_REGISTROS] } };
