// Prazo vindo da IA: "AAAA-MM-DD" vale o dia (meio-dia de Brasília, como a tela grava); com horário, vale a hora.
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Prazo e se ele tem horário, no formato que a API de registros e de chamados recebe.
 * @example mcpDue("2026-10-16") // { dueAt: "2026-10-16T12:00:00-03:00", dueHasTime: false }
 * @example mcpDue("2026-10-16T14:30:00-03:00") // { dueAt: "2026-10-16T14:30:00-03:00", dueHasTime: true }
 */
export function mcpDue(value: string): { dueAt: string; dueHasTime: boolean } {
  if (DAY_ONLY.test(value)) return { dueAt: `${value}T12:00:00-03:00`, dueHasTime: false };
  return { dueAt: value, dueHasTime: true };
}

/**
 * Mudança de prazo do atualizar_registro: sem prazo na mudança, nada muda; null limpa o prazo e o horário.
 * @example mcpDueChange(null) // { dueAt: null, dueHasTime: false }
 */
export function mcpDueChange(value: string | null | undefined): { dueAt?: string | null; dueHasTime?: boolean } {
  if (value === undefined) return {};
  if (value === null) return { dueAt: null, dueHasTime: false };
  return mcpDue(value);
}
