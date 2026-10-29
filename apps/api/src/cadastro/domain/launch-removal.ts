import { DomainError } from "../../kernel/domain-error";

// Registro e RP guardam lineId e factoryId sem chave estrangeira: a linha ou a fábrica sairia do cadastro
// e eles não salvariam mais ("Linha não encontrada"). Achado na conferência dos vínculos (PR #152).
export type CadastroLaunches = { records: number; rps: number };

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Recusa a exclusão de um item do cadastro que tem chamado, tarefa, problema ou RP apontando para ele.
 * @example assertNoLaunches("a linha", { records: 2, rps: 1 }, "Mude o status da linha para tirá-la de uso.")
 */
export function assertNoLaunches(label: string, launches: CadastroLaunches, alternative: string): void {
  const found = [
    launches.records > 0 ? plural(launches.records, "registro (chamado, tarefa ou problema)", "registros (chamados, tarefas ou problemas)") : null,
    launches.rps > 0 ? plural(launches.rps, "RP", "RPs") : null,
  ].filter((item): item is string => item !== null);
  if (!found.length) return;
  const verb = launches.records + launches.rps === 1 ? "aponta" : "apontam";
  throw new DomainError("cadastro_in_use", 409, `Não dá para excluir ${label}: ${found.join(" e ")} ${verb} para ela. ${alternative}`);
}
