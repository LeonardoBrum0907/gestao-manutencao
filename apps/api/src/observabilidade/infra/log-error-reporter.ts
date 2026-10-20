import { telemetrySafeUrl } from "@manutencao/shared";
import type { ErrorReporter, ErrorScene } from "../application/error-reporter";
import { writeJsonLog, type LogSink } from "./json-log";

type ErrorSummary = { name: string; message: string; stack: string | null };

/**
 * Resume um erro qualquer para o log. A mensagem passa pela limpeza de endereços porque erros de
 * rota podem trazer o código do link público de RP.
 * @example describeError(new TypeError("x")) // { name: "TypeError", message: "x", stack: "TypeError: x\n    at …" }
 */
export function describeError(error: unknown): ErrorSummary {
  if (!(error instanceof Error)) return { name: "NonError", message: telemetrySafeUrl(String(error)), stack: null };
  const stack = error.stack ? telemetrySafeUrl(error.stack) : null;
  return { name: error.name, message: telemetrySafeUrl(error.message), stack };
}

/**
 * Grava o erro inesperado como `unexpected_error` em JSON, com o stack trace. Antes (até o filtro
 * global mudar) o 500 respondia sem deixar nada no `caderno-admin logs api`.
 * @example new LogErrorReporter(console.error).report(error, { method: "GET", route: "/api/records" })
 */
export class LogErrorReporter implements ErrorReporter {
  constructor(private readonly sink: LogSink) {}

  report(error: unknown, scene: ErrorScene): void {
    writeJsonLog(this.sink, "unexpected_error", { ...scene, ...describeError(error) });
  }
}
