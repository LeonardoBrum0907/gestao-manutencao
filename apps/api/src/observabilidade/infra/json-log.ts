/** Recebe uma linha pronta de log. Em produção é o stdout ou o stderr; nos testes, uma lista. */
export type LogSink = (line: string) => void;

/**
 * Escreve um evento numa linha JSON com a hora em ISO, que o `docker logs` guarda como veio.
 * @example writeJsonLog(console.log, "http_request", { status: 200 }) // {"time":"2026-…","event":"http_request","status":200}
 */
export function writeJsonLog(sink: LogSink, event: string, fields: Record<string, unknown>, now: Date = new Date()): void {
  sink(JSON.stringify({ time: now.toISOString(), event, ...fields }));
}
