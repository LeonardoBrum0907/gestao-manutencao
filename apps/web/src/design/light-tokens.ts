// Saídas que não seguem o tema da tela (planilha, impressão) saem sempre no tema claro. Em vez de repetir os
// hex de tokens.css, leem os valores de lá: tokens.css continua sendo o único lugar das cores.

export type TokenReader = (token: string) => string;

/**
 * Lê os tokens do tema claro direto do CSS, num elemento escondido com data-theme="light".
 * @example const read = domLightTokenReader(); read("--accent-soft") // "#dcf3e6"
 */
export function domLightTokenReader(): TokenReader {
  const probe = document.createElement("div");
  probe.dataset.theme = "light";
  probe.hidden = true;
  document.body.append(probe);
  const style = getComputedStyle(probe);
  const values = new Map<string, string>();
  return (token) => {
    if (!values.has(token)) values.set(token, style.getPropertyValue(token).trim());
    return values.get(token) ?? "";
  };
}

/**
 * Troca nomes de token por cores, falhando alto se algum não existir (nome errado ou tokens.css sem ele).
 * @example lightColors({ fill: "--accent-soft", text: "--accent-ink" }, read) // { fill: "#dcf3e6", text: "#17543a" }
 */
export function lightColors<K extends string>(tokens: Record<K, string>, read: TokenReader): Record<K, string> {
  const entries = Object.entries<string>(tokens).map(([key, token]) => {
    const value = read(token);
    if (!value) throw new Error(`Token de cor "${token}" não encontrado em tokens.css; esperado um nome como "--accent-soft".`);
    return [key, value];
  });
  return Object.fromEntries(entries) as Record<K, string>;
}
