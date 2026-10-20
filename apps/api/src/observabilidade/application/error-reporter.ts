/** Onde a API estava quando o erro aconteceu: método e rota, já sem códigos secretos. */
export type ErrorScene = { method: string; route: string };

/**
 * Destino dos erros que viram 500. Quem chama não sabe se vai para o log, para o Sentry ou para os dois.
 * @example reporter.report(error, { method: "POST", route: "/api/records" })
 */
export interface ErrorReporter {
  report(error: unknown, scene: ErrorScene): void;
}

export const ERROR_REPORTER = Symbol("ErrorReporter");

/**
 * Repassa o mesmo erro para vários destinos, na ordem dada.
 * @example new FanOutErrorReporter([new LogErrorReporter(console.error), new SentryErrorReporter()])
 */
export class FanOutErrorReporter implements ErrorReporter {
  constructor(private readonly reporters: readonly ErrorReporter[]) {}

  report(error: unknown, scene: ErrorScene): void {
    for (const reporter of this.reporters) reporter.report(error, scene);
  }
}
