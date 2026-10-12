import { isDashboardPeriod, type DashboardPeriod } from "@manutencao/shared";

// Filtros do Dashboard no endereço: voltar para a tela mantém o período e a fábrica escolhidos.
export type OverviewFilter = { days: DashboardPeriod; factoryId: string };

export const DEFAULT_DAYS: DashboardPeriod = 30;

/**
 * Lê ?dias= e ?fabrica= do endereço; o que não vale volta ao padrão (30 dias, todas as fábricas).
 * @example readOverviewFilter(new URLSearchParams("dias=7")) // { days: 7, factoryId: "" }
 */
export function readOverviewFilter(search: URLSearchParams): OverviewFilter {
  const days = Number(search.get("dias"));
  return { days: isDashboardPeriod(days) ? days : DEFAULT_DAYS, factoryId: search.get("fabrica") ?? "" };
}

/**
 * Grava os filtros no endereço, sem o que está no padrão.
 * @example writeOverviewFilter({ days: 30, factoryId: "f2" }).toString() // "fabrica=f2"
 */
export function writeOverviewFilter(filter: OverviewFilter): URLSearchParams {
  const search = new URLSearchParams();
  if (filter.days !== DEFAULT_DAYS) search.set("dias", String(filter.days));
  if (filter.factoryId) search.set("fabrica", filter.factoryId);
  return search;
}

/**
 * Parâmetros da chamada à API (sempre com o período).
 * @example overviewApiQuery({ days: 7, factoryId: "" }) // "dias=7"
 */
export function overviewApiQuery(filter: OverviewFilter): string {
  const search = new URLSearchParams({ dias: String(filter.days) });
  if (filter.factoryId) search.set("fabrica", filter.factoryId);
  return search.toString();
}
