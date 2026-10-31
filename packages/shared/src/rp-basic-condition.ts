// "Impacto em condição básica?" do RP é só Sim ou Não (pedido do Léo, 2026-10-31). A coluna do banco segue texto
// (Rp.basicConditionImpact): antes era livre e guardou "N/A", "não" e o quadrinho do modelo do WhatsApp
// ("(  ) Sim.  ( X ) Não."). Estas funções leem esses jeitos como Sim ou Não; o que não der para ler fica como veio.

export const RP_BASIC_CONDITION_ANSWERS = ["Sim", "Não"] as const;
export type RpBasicConditionAnswer = (typeof RP_BASIC_CONDITION_ANSWERS)[number];

// "( X ) Não", "(x)Sim": o quadrinho marcado do modelo do WhatsApp.
const MARKED_BOX = /\(\s*x\s*\)\s*(sim|nao)\b/;
const FIRST_WORD = /^(sim|nao)\b/;
// "N/A", "NA", "não se aplica": sem impacto, conta como Não.
const NOT_APPLICABLE = /^(n\s*\/\s*a|na|nao se aplica|nao aplica)$/;

function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function answerOf(word: string): RpBasicConditionAnswer {
  return word === "sim" ? "Sim" : "Não";
}

/**
 * Lê a resposta Sim/Não de um texto do campo, ou null quando o texto não diz nenhum dos dois.
 * @example basicConditionAnswer("(  ) Sim.  ( X ) Não.") // "Não"
 * @example basicConditionAnswer("N/A") // "Não"
 */
export function basicConditionAnswer(text: string | null | undefined): RpBasicConditionAnswer | null {
  const folded = fold(text ?? "");
  const marked = MARKED_BOX.exec(folded);
  if (marked) return answerOf(marked[1]);
  const bare = folded.replace(/[\s.!:;,-]+$/, "");
  if (NOT_APPLICABLE.test(bare)) return "Não";
  const first = FIRST_WORD.exec(bare);
  return first ? answerOf(first[1]) : null;
}

/**
 * O valor a gravar e mostrar: "Sim" ou "Não" quando dá para ler; senão o texto como veio, ou null se vazio.
 * @example canonicalBasicConditionImpact("não") // "Não"
 * @example canonicalBasicConditionImpact("  ") // null
 */
export function canonicalBasicConditionImpact(text: string | null | undefined): string | null {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return null;
  return basicConditionAnswer(trimmed) ?? trimmed;
}
