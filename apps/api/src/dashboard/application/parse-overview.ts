import { DASHBOARD_PERIODS, isDashboardPeriod, type DashboardPeriod } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export type OverviewQuery = { dias?: unknown; fabrica?: unknown };
export type OverviewFilter = { days: DashboardPeriod; factoryId: string | null };

export const DEFAULT_PERIOD: DashboardPeriod = 30;

function text(value: unknown): string | null {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" && first.trim() ? first.trim() : null;
}

/**
 * Filtros do Dashboard vindos do endereço: período em dias (7, 30 ou 90) e fábrica opcional.
 * @example parseOverviewQuery({ dias: "7", fabrica: "fab_2" }) // { days: 7, factoryId: "fab_2" }
 */
export function parseOverviewQuery(query: OverviewQuery): OverviewFilter {
  const days = text(query.dias);
  const factoryId = text(query.fabrica);
  if (days === null) return { days: DEFAULT_PERIOD, factoryId };
  const parsed = Number(days);
  if (!isDashboardPeriod(parsed)) {
    throw new DomainError("invalid", 400, `Período "${days}" inválido. Use ${DASHBOARD_PERIODS.join(", ")} dias.`);
  }
  return { days: parsed, factoryId };
}
