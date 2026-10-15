import { GESTOR_TIME_ZONE, type PushMessage } from "@manutencao/shared";

const clock = new Intl.DateTimeFormat("pt-BR", { timeZone: GESTOR_TIME_ZONE, hour: "2-digit", minute: "2-digit" });

/**
 * Aviso do botão "Enviar aviso de teste": confirma que o aparelho recebe e leva de volta para Configurações › Avisos.
 * @example testPushMessage(new Date("2026-10-14T23:50:00Z")).body // "… Enviado às 20:50."
 */
export function testPushMessage(now: Date): PushMessage {
  return {
    title: "Aviso de teste",
    body: `Os avisos estão chegando neste aparelho. Enviado às ${clock.format(now)}.`,
    url: "/configuracoes/avisos",
    tag: "teste",
  };
}

/** Texto que vai cifrado para o aparelho; o sw.js lê de volta com `event.data.json()`. */
export function pushPayload(message: PushMessage): string {
  return JSON.stringify(message);
}
