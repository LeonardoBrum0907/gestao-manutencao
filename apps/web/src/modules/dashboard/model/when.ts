import { GESTOR_TIME_ZONE } from "@manutencao/shared";

const whenFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: GESTOR_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDashboardWhen(iso: string): string {
  return whenFormat.format(new Date(iso));
}

export function openRankLabel(count: number): string {
  return count === 1 ? "1 aberto" : `${count} abertos`;
}
