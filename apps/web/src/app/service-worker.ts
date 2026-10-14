/** Parte do navegador que este módulo usa para registrar o service worker. */
export type ServiceWorkerRegistrar = Pick<ServiceWorkerContainer, "register">;

/**
 * Registra o service worker do app instalável (public/sw.js), que faz o Android e o iPhone oferecerem
 * "Instalar app". Só no build de produção: no `vite dev` ele ficaria no meio do recarregamento rápido.
 * Devolve se o registro deu certo; uma falha só deixa o app sem instalação, então vira aviso no console.
 * @example registerServiceWorker(navigator.serviceWorker, import.meta.env.PROD)
 */
export async function registerServiceWorker(
  registrar: ServiceWorkerRegistrar | undefined,
  isProduction: boolean,
  warn: (line: string) => void = console.warn,
): Promise<boolean> {
  if (!registrar || !isProduction) return false;
  try {
    await registrar.register("/sw.js", { scope: "/" });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warn(JSON.stringify({ event: "service_worker_register_failed", script: "/sw.js", message }));
    return false;
  }
}
