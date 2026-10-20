import { telemetrySafeUrl } from "./telemetry-url";

/** A parte do pedido que um evento do Sentry pode carregar. Só a URL limpa e o método ficam. */
export type TelemetryRequest = {
  url?: string;
  method?: string;
  query_string?: unknown;
  data?: unknown;
  cookies?: unknown;
  headers?: unknown;
  env?: unknown;
};

/** Rastro (breadcrumb) do Sentry: navegação, fetch, console. */
export type TelemetryBreadcrumb = { message?: string; data?: Record<string, unknown> };

/** O que a limpeza lê de um evento do Sentry. O tipo de verdade vem do SDK e tem mais campos. */
export type TelemetryEvent = {
  request?: TelemetryRequest;
  user?: unknown;
  breadcrumbs?: TelemetryBreadcrumb[];
  // Nome da transação: o SDK do Node monta com o caminho de verdade ("GET /api/public/rp/<código>/…").
  transaction?: string;
};

// Campos de rastro que guardam endereço: url no fetch/xhr, from/to na navegação.
const BREADCRUMB_URL_KEYS = ["url", "from", "to"] as const;

function scrubRequest(request: TelemetryRequest): void {
  delete request.query_string;
  delete request.data;
  delete request.cookies;
  delete request.headers;
  delete request.env;
  if (request.url) request.url = telemetrySafeUrl(request.url);
}

/**
 * Limpa um rastro antes do envio: troca o código do link público de RP e tira a consulta dos endereços.
 * @example scrubTelemetryBreadcrumb({ data: { to: "/rp/abrir/k8F3x" } }) // { data: { to: "/rp/abrir/:code" } }
 */
export function scrubTelemetryBreadcrumb<T extends TelemetryBreadcrumb>(crumb: T): T {
  if (crumb.message) crumb.message = telemetrySafeUrl(crumb.message);
  const data = crumb.data;
  if (!data) return crumb;
  for (const key of BREADCRUMB_URL_KEYS) {
    const value = data[key];
    if (typeof value === "string") data[key] = telemetrySafeUrl(value);
  }
  return crumb;
}

/**
 * Último filtro antes de um erro sair para o Sentry, na API e na tela: sem usuário, sem corpo,
 * cabeçalhos, cookies ou consulta, e sem o código do link público de RP. Altera o próprio evento.
 * @example Sentry.init({ beforeSend: (event) => scrubTelemetryEvent(event) })
 */
export function scrubTelemetryEvent<T extends TelemetryEvent>(event: T): T {
  delete event.user;
  if (event.request) scrubRequest(event.request);
  if (event.transaction) event.transaction = telemetrySafeUrl(event.transaction);
  event.breadcrumbs?.forEach(scrubTelemetryBreadcrumb);
  return event;
}

/** Formato da opção `dataCollection` com tudo desligado. `never[]` cabe na lista de corpos do SDK. */
export type PrivateDataCollection = {
  userInfo: false;
  cookies: false;
  httpHeaders: false;
  httpBodies: never[];
  urlQueryParams: false;
  databaseQueryData: false;
  queues: false;
  stackFrameVariables: false;
  graphQL: { document: false; variables: false };
  genAI: { inputs: false; outputs: false };
};

/**
 * Opção `dataCollection` do Sentry (SDK 11) para API e tela: nada de usuário, cookies, cabeçalhos,
 * corpos, consulta, dados de consulta ao banco nem variáveis locais (que guardariam nomes de técnicos
 * e textos de RP). Fica o stack trace com as linhas de código em volta.
 * @example Sentry.init({ dsn, dataCollection: SENTRY_PRIVATE_DATA_COLLECTION })
 */
export const SENTRY_PRIVATE_DATA_COLLECTION: PrivateDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
};
