import { isMemberPosition, type MemberPosition } from "@manutencao/shared";

/**
 * Filtro de cargo da lista de Colaboradores, lido do endereço (?position=technician). Valor desconhecido, como um
 * link antigo ou digitado à mão, vale como "Todos" em vez de esvaziar a lista.
 * @example memberPositionFilter("supervisor") // "supervisor"
 * @example memberPositionFilter("tecnico") // ""
 */
export function memberPositionFilter(param: string | null): MemberPosition | "" {
  return param && isMemberPosition(param) ? param : "";
}
