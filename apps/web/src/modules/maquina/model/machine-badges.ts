import type { MachineOperationalStatus } from "@manutencao/shared";

// Avisos de uma máquina na linha da lista do celular, do mais urgente ao menos.
export type MachineBadge = "stopped" | "points";

/**
 * Avisos que a linha da máquina mostra no celular: a parada e os pontos de atenção ativos, os dois juntos quando há.
 * @example machineBadges("stopped", 1) // ["stopped", "points"]
 */
export function machineBadges(status: MachineOperationalStatus, points: number): MachineBadge[] {
  const badges: MachineBadge[] = [];
  if (status === "stopped") badges.push("stopped");
  if (points > 0) badges.push("points");
  return badges;
}
