import { DomainError } from "../../kernel/domain-error";

// As funções do SIGEM saem como qualquer outra: a API só as cria num banco sem nenhuma função (ver role-seed.ts).
export function assertRoleCanBeRemoved(memberCount: number): void {
  if (memberCount > 0) {
    throw new DomainError("role_in_use", 409, `Não dá para excluir a função enquanto houver colaborador com ela (${memberCount}).`);
  }
}
