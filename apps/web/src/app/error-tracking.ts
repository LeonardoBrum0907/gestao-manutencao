/** Manda um erro ao serviço de erros (o Sentry, quando ligado). */
export type CaptureError = (error: unknown) => void;

/** Carrega o SDK do serviço de erros e devolve a função de envio. */
export type LoadErrorCapture = () => Promise<CaptureError>;

/** Recebe os erros que quebraram uma tela. */
export type ErrorTracking = { report: CaptureError };

/**
 * Liga o envio de erros da tela. O SDK carrega em segundo plano para não pesar a primeira abertura;
 * erro que chega antes disso fica na fila e sai assim que o SDK subir. Sem carregador, não faz nada.
 * @example const tracking = createErrorTracking(dsn ? sentryLoader(dsn, "producao") : null); tracking.report(error);
 */
export function createErrorTracking(load: LoadErrorCapture | null, warn: (message: string) => void = console.warn): ErrorTracking {
  if (!load) return { report: () => undefined };
  let capture: CaptureError | null = null;
  const waiting: unknown[] = [];
  load()
    .then((loaded) => {
      capture = loaded;
      waiting.splice(0).forEach(loaded);
    })
    .catch((error: unknown) => warn(`Serviço de erros não carregou: ${String(error)}`));
  return { report: (error) => (capture ? capture(error) : void waiting.push(error)) };
}
