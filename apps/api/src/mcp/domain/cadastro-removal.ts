import { DomainError } from "../../kernel/domain-error";

// Lançamentos que apontam para um item do cadastro e que o banco solta em silêncio (SetNull ou id sem chave)
// quando ele é excluído. A tela avisa e deixa o gestor decidir; pela IA a exclusão é recusada.
export type CadastroLinks = { records: number; rps: number; techCards: number };

export const NO_CADASTRO_LINKS: CadastroLinks = { records: 0, rps: 0, techCards: 0 };

const LINK_NAMES: readonly [keyof CadastroLinks, string, string][] = [
  ["records", "registro (chamado, tarefa, problema ou feedback)", "registros (chamados, tarefas, problemas ou feedbacks)"],
  ["rps", "RP", "RPs"],
  ["techCards", "ficha de documentação técnica", "fichas de documentação técnica"],
];

/**
 * Lista o que está ligado, em texto para a IA mostrar ao gestor.
 * @example describeCadastroLinks({ records: 2, rps: 1, techCards: 0 }) // ["2 registros (...)", "1 RP"]
 */
export function describeCadastroLinks(links: CadastroLinks): string[] {
  return LINK_NAMES.filter(([key]) => links[key] > 0).map(([key, one, many]) => `${links[key]} ${links[key] === 1 ? one : many}`);
}

export const SCREEN_ONLY = "Se o gestor quiser mesmo excluir, é pela tela.";

/**
 * Recusa a exclusão pela IA quando há lançamento ligado ao item; `alternative` diz o que fazer no lugar.
 * @example assertNothingLinked("a máquina Encartuchadeira", await links.ofMachine(id))
 */
export function assertNothingLinked(label: string, links: CadastroLinks, alternative: string = SCREEN_ONLY): void {
  const found = describeCadastroLinks(links);
  if (!found.length) return;
  throw new DomainError(
    "cadastro_linked",
    409,
    `Não excluo ${label} pela IA: há ligação com ${found.join(" e ")}. Excluir apagaria essa referência nesses lançamentos. ${alternative}`,
  );
}
