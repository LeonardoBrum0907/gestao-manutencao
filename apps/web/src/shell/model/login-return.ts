// Para onde o login leva quando ninguém pediu tela nenhuma.
export const HOME_PATH = "/meu-dia";

// O que a casca guarda no state do redirecionamento para o login: a tela que a pessoa tentou abrir.
export type LoginReturnState = { from: string };

/**
 * Guarda a tela pedida (caminho e filtros) para o login devolver a pessoa a ela depois de entrar.
 * @example loginReturnState({ pathname: "/registros/r1", search: "?aba=historico" }) // { from: "/registros/r1?aba=historico" }
 */
export function loginReturnState(location: { pathname: string; search: string }): LoginReturnState {
  return { from: location.pathname + location.search };
}

/**
 * Tela para abrir depois do login: a que foi pedida antes, ou o Meu Dia. Só aceita caminho deste app
 * ("/algo", nunca "//outro-site" nem o próprio /login), porque o state vem do histórico do navegador.
 * @example loginReturnPath({ from: "/maquinas?status=stopped" }) // "/maquinas?status=stopped"
 */
export function loginReturnPath(state: unknown): string {
  const from = (state as Partial<LoginReturnState> | null)?.from;
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) return HOME_PATH;
  if (from === "/" || from.startsWith("/login")) return HOME_PATH;
  return from;
}
