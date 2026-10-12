import type { GradeExpectedDto } from "@manutencao/shared";

// Colunas do esperado por dificuldade no grau; a matriz (competencia) lê as mesmas para calcular a aderência.
export const GRADE_EXPECTED_SELECT = { expectedBasic: true, expectedIntermediate: true, expectedAdvanced: true } as const;

export type GradeExpectedRow = { expectedBasic: number | null; expectedIntermediate: number | null; expectedAdvanced: number | null };

/**
 * Converte as colunas do grau no esperado por dificuldade.
 * @example gradeExpectedOf({ expectedBasic: null, expectedIntermediate: 2, expectedAdvanced: 1 }) // { basic: null, intermediate: 2, advanced: 1 }
 */
export function gradeExpectedOf(row: GradeExpectedRow): GradeExpectedDto {
  return { basic: row.expectedBasic, intermediate: row.expectedIntermediate, advanced: row.expectedAdvanced };
}

/**
 * O inverso de gradeExpectedOf, para gravar.
 * @example gradeExpectedColumns({ basic: 1, intermediate: null, advanced: null }) // { expectedBasic: 1, expectedIntermediate: null, expectedAdvanced: null }
 */
export function gradeExpectedColumns(expected: GradeExpectedDto): GradeExpectedRow {
  return { expectedBasic: expected.basic, expectedIntermediate: expected.intermediate, expectedAdvanced: expected.advanced };
}
