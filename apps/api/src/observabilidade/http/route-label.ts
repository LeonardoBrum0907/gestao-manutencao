import { telemetrySafeUrl } from "@manutencao/shared";

/** O que a etiqueta de rota lê do pedido do Express. */
export type RoutedRequest = { baseUrl: string; originalUrl: string; route?: { path?: unknown } };

// Pedido sem rota (404, robôs procurando /wp-admin) pode ter caminho enorme: corta para o log não inchar.
const UNROUTED_PATH_MAX = 120;

/**
 * Nome da rota para log e Sentry: o molde (`/api/records/:id`) quando o Express achou a rota, para
 * agrupar os pedidos; senão o caminho limpo, sem consulta e sem o código do link público de RP.
 * @example routeLabel({ baseUrl: "", originalUrl: "/api/records/7", route: { path: "/api/records/:id" } }) // "/api/records/:id"
 */
export function routeLabel(request: RoutedRequest): string {
  const pattern = request.route?.path;
  if (typeof pattern === "string") return `${request.baseUrl}${pattern}`;
  return telemetrySafeUrl(request.originalUrl).slice(0, UNROUTED_PATH_MAX);
}
