import { isMatrixCategory, MATRIX_CATEGORIES, type MatrixCategory } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";

/**
 * Categoria da matriz que a função vê, vinda de { category }. null (ou "") = as duas categorias.
 * @example requireRoleMatrixCategory({ category: "electrical" }) // "electrical"
 */
export function requireRoleMatrixCategory(body: unknown): MatrixCategory | null {
  const value = readObject(body).category;
  if (value === null || value === "") return null;
  if (!isMatrixCategory(value)) {
    throw new DomainError("invalid", 400, `Categoria inválida: ${JSON.stringify(value)}. Use ${MATRIX_CATEGORIES.join(", ")} ou null para as duas.`);
  }
  return value;
}
