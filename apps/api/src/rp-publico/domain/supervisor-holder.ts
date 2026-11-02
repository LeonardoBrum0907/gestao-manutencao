// Situação de hoje no cadastro de quem recebeu o link de supervisor; null quando foi excluído.
export type SupervisorHolder = { status: string; position: string } | null;

/**
 * O link pessoal só vale enquanto a pessoa está no cadastro, não está desligada e a função dela lidera equipe.
 * Antes ele seguia aprovando em nome de quem saiu (conferência dos vínculos, PR #152). Férias e afastamento não derrubam.
 * @example holdsSupervisorLink({ status: "vacation", position: "supervisor" }) // true
 */
export function holdsSupervisorLink(holder: SupervisorHolder): boolean {
  return holder !== null && holder.status !== "inactive" && holder.position === "supervisor";
}
