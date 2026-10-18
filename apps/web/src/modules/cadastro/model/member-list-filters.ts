/**
 * Filtro de função da lista de Colaboradores, lido do endereço (?funcao=<id>). Id desconhecido, como um link
 * antigo ou de uma função excluída, vale como "Todas" em vez de esvaziar a lista.
 * @example memberRoleFilter("r1", [{ id: "r1" }]) // "r1"
 * @example memberRoleFilter("x", [{ id: "r1" }]) // ""
 */
export function memberRoleFilter(param: string | null, roles: readonly { id: string }[]): string {
  return param && roles.some((role) => role.id === param) ? param : "";
}
