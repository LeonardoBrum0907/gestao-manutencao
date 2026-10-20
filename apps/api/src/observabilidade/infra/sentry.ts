import * as Sentry from "@sentry/node";
import { SENTRY_PRIVATE_DATA_COLLECTION, scrubTelemetryBreadcrumb, scrubTelemetryEvent } from "@manutencao/shared";
import type { ErrorReporter, ErrorScene } from "../application/error-reporter";
import type { SentryConfig } from "../sentry-config";

/**
 * Liga o Sentry só para erros: sem tracing, para não gastar a CPU única da VPS a cada pedido.
 * Chamar antes do Nest subir, para pegar também as promessas rejeitadas sem tratamento.
 * @example const sentry = readSentryConfig(process.env); if (sentry) startSentry(sentry);
 */
export function startSentry(config: SentryConfig): void {
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    // O SDK 11 coleta cabeçalhos, corpos e variáveis locais por padrão; aqui tudo isso fica de fora.
    dataCollection: SENTRY_PRIVATE_DATA_COLLECTION,
    beforeSend: (event) => scrubTelemetryEvent(event),
    beforeBreadcrumb: (crumb) => scrubTelemetryBreadcrumb(crumb),
  });
}

/** Manda o erro que virou 500 ao Sentry, com método e rota como etiquetas para filtrar. */
export class SentryErrorReporter implements ErrorReporter {
  report(error: unknown, scene: ErrorScene): void {
    Sentry.captureException(error, { tags: { method: scene.method, route: scene.route } });
  }
}
