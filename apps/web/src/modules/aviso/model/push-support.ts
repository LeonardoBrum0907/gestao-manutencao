import { GESTOR_TIME_ZONE } from "@manutencao/shared";

/** O que o navegador deste aparelho oferece, lido uma vez pela tela de Avisos. */
export type PushEnvironment = {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  permission: NotificationPermission | "missing";
  standalone: boolean;
  userAgent: string;
};

/**
 * - unsupported: o navegador não recebe Web Push.
 * - install-first: iPhone/iPad só recebe aviso com o app instalado na Tela de Início.
 * - blocked: a pessoa negou a permissão; só se desfaz nas configurações do navegador.
 * - ready: dá para pedir a inscrição.
 */
export type PushSupport = "unsupported" | "install-first" | "blocked" | "ready";

function isAppleMobile(userAgent: string): boolean {
  return /iPhone|iPad|iPod/.test(userAgent);
}

/**
 * Diz se este aparelho pode receber avisos e, se não, por quê.
 * @example pushSupport({ hasServiceWorker: true, hasPushManager: true, permission: "default", standalone: false, userAgent: "Android" }) // "ready"
 */
export function pushSupport(env: PushEnvironment): PushSupport {
  // O Safari do iPhone esconde o PushManager fora do app instalado, então a checagem do iPhone vem antes.
  if (isAppleMobile(env.userAgent) && !env.standalone) return "install-first";
  if (!env.hasServiceWorker || !env.hasPushManager || env.permission === "missing") return "unsupported";
  if (env.permission === "denied") return "blocked";
  return "ready";
}

/**
 * Converte a chave pública VAPID (base64url, como o servidor manda) nos bytes que `pushManager.subscribe` pede.
 * @example applicationServerKey("AQID") // Uint8Array [1, 2, 3]
 */
export function applicationServerKey(base64url: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(base64url)) {
    throw new Error(`Chave pública "${base64url.slice(0, 12)}…" fora do formato base64url (A-Z, a-z, 0-9, - e _).`);
  }
  const padded = base64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64url.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

const SYSTEMS: [RegExp, string][] = [
  [/Android/, "Android"],
  [/iPhone|iPod/, "iPhone"],
  [/iPad/, "iPad"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "Mac"],
  [/Linux/, "Linux"],
];

// A ordem importa: o Edge e o Opera também dizem "Chrome", e o Chrome também diz "Safari".
const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser/, "Samsung Internet"],
  [/Firefox\/|FxiOS/, "Firefox"],
  [/Chrome\/|CriOS/, "Chrome"],
  [/Safari\//, "Safari"],
];

function firstMatch(userAgent: string, table: [RegExp, string][]): string | null {
  return table.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null;
}

/**
 * Nome curto do aparelho para a lista de Configurações › Avisos.
 * @example deviceLabel("Mozilla/5.0 (Linux; Android 14) ... Chrome/129.0 Mobile Safari/537.36") // "Android · Chrome"
 */
export function deviceLabel(userAgent: string): string {
  const parts = [firstMatch(userAgent, SYSTEMS), firstMatch(userAgent, BROWSERS)].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(" · ") : "Aparelho sem nome";
}

const sentFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: GESTOR_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Linha de apoio do aparelho na lista: quando recebeu o último aviso.
 * @example lastSentText("2026-10-15T00:30:00.000Z") // "Último aviso em 14/10, 21:30"
 */
export function lastSentText(lastSentAt: string | null): string {
  if (!lastSentAt) return "Ainda não recebeu aviso";
  return `Último aviso em ${sentFormat.format(new Date(lastSentAt))}`;
}
