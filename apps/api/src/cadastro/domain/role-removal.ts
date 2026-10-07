import { MEMBER_ROLES } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

// As seis funções do SIGEM voltam sozinhas quando a API sobe, então excluir não adiantaria.
export function assertRoleCanBeRemoved(name: string, memberCount: number): void {
  if ((MEMBER_ROLES as readonly string[]).includes(name)) {
    throw new DomainError("role_is_default", 409, "As seis funções do SIGEM ficam sempre na lista. Dá para renomear, não para excluir.");
  }
  if (memberCount > 0) {
    throw new DomainError("role_in_use", 409, "Não dá para excluir a função enquanto houver colaborador com ela.");
  }
}
