import type { PushSendResultDto } from "@manutencao/shared";

function devices(count: number): string {
  return count === 1 ? "1 aparelho" : `${count} aparelhos`;
}

/**
 * Texto do aviso curto depois de "Enviar aviso de teste".
 * @example testResultText({ sent: 2, removed: 0, failed: 0 }) // "Aviso de teste enviado para 2 aparelhos."
 */
export function testResultText(result: PushSendResultDto): string {
  if (result.sent + result.removed + result.failed === 0) return "Nenhum aparelho recebe avisos ainda.";
  const parts = [result.sent > 0 ? `Aviso de teste enviado para ${devices(result.sent)}.` : "O aviso de teste não chegou a nenhum aparelho."];
  // Removido: o serviço do navegador disse que a inscrição não existe mais (app desinstalado, permissão tirada).
  if (result.removed > 0) parts.push(`${devices(result.removed)} saiu da lista porque não aceita mais avisos.`);
  if (result.failed > 0) parts.push(`${devices(result.failed)} não respondeu; tente de novo mais tarde.`);
  return parts.join(" ");
}
