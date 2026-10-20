import type { ErrorReporter, ErrorScene } from "./error-reporter";

/** Guarda os erros recebidos para os testes conferirem. */
export class FakeErrorReporter implements ErrorReporter {
  readonly reports: { error: unknown; scene: ErrorScene }[] = [];

  report(error: unknown, scene: ErrorScene): void {
    this.reports.push({ error, scene });
  }
}
