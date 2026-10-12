import { COMPETENCY_LEVELS, type GradeExpectedDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";

/**
 * Lê o esperado por dificuldade enviado para um grau: cada dificuldade vem com 1 a 4, ou null para usar o padrão.
 * @example requireGradeExpected({ expected: { basic: null, intermediate: 2, advanced: 1 } })
 */
export function requireGradeExpected(body: unknown): GradeExpectedDto {
  const expected = readObject(readObject(body).expected);
  const result: GradeExpectedDto = { basic: null, intermediate: null, advanced: null };
  for (const level of COMPETENCY_LEVELS) {
    const value = expected[level];
    if (value === null || value === undefined) continue;
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 4) {
      throw new DomainError("expected", 400, `O esperado de "${level}" vai de 1 a 4 (ou vazio para o padrão); recebi ${JSON.stringify(value)}.`);
    }
    result[level] = value;
  }
  return result;
}
