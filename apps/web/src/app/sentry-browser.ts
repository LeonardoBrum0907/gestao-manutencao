import { SENTRY_PRIVATE_DATA_COLLECTION, scrubTelemetryBreadcrumb, scrubTelemetryEvent } from "@manutencao/shared";
import type { LoadErrorCapture } from "./error-tracking";

/**
 * Carregador do Sentry para a tela: baixa o SDK num pedaço separado do bundle e liga só os erros
 * (sem tracing e sem replay), com a mesma limpeza da API.
 * @example createErrorTracking(sentryLoader(import.meta.env.VITE_SENTRY_DSN, "producao"))
 */
export function sentryLoader(dsn: string, environment: string): LoadErrorCapture {
  return async () => {
    const Sentry = await import("./sentry-sdk");
    Sentry.init({
      dsn,
      environment,
      dataCollection: SENTRY_PRIVATE_DATA_COLLECTION,
      beforeSend: (event) => scrubTelemetryEvent(event),
      beforeBreadcrumb: (crumb) => scrubTelemetryBreadcrumb(crumb),
    });
    return (error) => void Sentry.captureException(error);
  };
}
