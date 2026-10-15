import type { PushSubscribeBody } from "@manutencao/shared";
import { applicationServerKey, deviceLabel, type PushEnvironment } from "../model/push-support";

/** Falha do lado do navegador, já com o texto que a tela mostra. */
export class PushBrowserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PushBrowserError";
  }
}

/** Lê o que este navegador oferece para avisos. */
export function readPushEnvironment(): PushEnvironment {
  // O Safari antigo só diz que está instalado por navigator.standalone; os outros, pelo display-mode.
  const iosStandalone = "standalone" in navigator && navigator.standalone === true;
  return {
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    permission: "Notification" in window ? Notification.permission : "missing",
    standalone: iosStandalone || window.matchMedia("(display-mode: standalone)").matches,
    userAgent: navigator.userAgent,
  };
}

async function workerRegistration(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker?.getRegistration("/");
  // Em `pnpm dev` o sw.js não é registrado (service-worker.ts só registra em produção).
  if (!registration) throw new PushBrowserError("O app ainda não está pronto neste navegador. Recarregue a página e tente de novo.");
  return registration;
}

/** Inscrição deste aparelho, se ele já aceitou avisos. Sem service worker, não há inscrição. */
export async function thisDeviceSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker?.getRegistration("/");
  return (await registration?.pushManager.getSubscription()) ?? null;
}

async function askPermission(): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission === "granted") return;
  throw new PushBrowserError("Os avisos ficaram bloqueados. Libere as notificações deste site no navegador e tente de novo.");
}

/**
 * Pede a permissão, inscreve o aparelho no serviço de push do navegador e devolve o que a API grava.
 * @example await fetch("/api/push/devices", { method: "POST", body: JSON.stringify(await subscribeThisDevice(publicKey)) })
 */
export async function subscribeThisDevice(publicKey: string): Promise<PushSubscribeBody> {
  await askPermission();
  const registration = await workerRegistration();
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey) });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new PushBrowserError(`O navegador devolveu uma inscrição incompleta (endpoint e chaves p256dh/auth esperados, chegou ${JSON.stringify(Object.keys(json))}).`);
  }
  return { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }, label: deviceLabel(navigator.userAgent) };
}

/** Cancela a inscrição deste aparelho no navegador. Sem inscrição, não faz nada. */
export async function unsubscribeThisDevice(): Promise<void> {
  const subscription = await thisDeviceSubscription();
  await subscription?.unsubscribe();
}
