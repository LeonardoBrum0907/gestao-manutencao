import type { DashboardFourMDto, DashboardParetoDto, DashboardRepeatDto } from "@manutencao/shared";

export const PARETO_LIMIT = 5;
export const REPEAT_LIMIT = 5;

// Chamado no período: onde foi (máquina e/ou linha) e quanto durou entre abrir e fechar.
export type ChamadoFact = {
  openedAt: Date;
  durationMin: number | null;
  machineId: string | null;
  machineLabel: string | null;
  lineId: string | null;
  lineName: string | null;
};

// Falha ligada a uma máquina (chamado, RP ou problema), para achar reincidência.
export type FailureFact = { machineId: string; machineLabel: string; subassembly: string | null };

export type RpCauseFact = { material: boolean; machine: boolean; method: boolean; labor: boolean };

/**
 * Quantos chamados e a média de minutos dos que já fecharam.
 * @example chamadoTotals([{ durationMin: 30, … }, { durationMin: null, … }]) // { count: 2, avgMinutes: 30 }
 */
export function chamadoTotals(rows: readonly ChamadoFact[]): { count: number; avgMinutes: number | null } {
  const closed = rows.flatMap((row) => (row.durationMin === null ? [] : [row.durationMin]));
  const avgMinutes = closed.length ? Math.round(closed.reduce((sum, value) => sum + value, 0) / closed.length) : null;
  return { count: rows.length, avgMinutes };
}

// Chamado sem máquina conta na linha; sem as duas, fica fora do Pareto.
function paretoSpot(row: ChamadoFact): { key: string; label: string } | null {
  if (row.machineId && row.machineLabel) return { key: row.machineId, label: row.machineLabel };
  if (row.lineId && row.lineName) return { key: `line:${row.lineId}`, label: row.lineName };
  return null;
}

/**
 * Máquinas (ou linhas, quando o chamado não diz a máquina) com mais chamados, com os minutos somados.
 * Empate: mais minutos primeiro, depois o nome.
 * @example paretoOf(chamados)[0] // { key: "maq_1", label: "Encartuchadeira CAM 05", count: 9, minutes: 640 }
 */
export function paretoOf(rows: readonly ChamadoFact[], limit: number = PARETO_LIMIT): DashboardParetoDto[] {
  const byKey = new Map<string, DashboardParetoDto>();
  for (const row of rows) {
    const spot = paretoSpot(row);
    if (!spot) continue;
    const item = byKey.get(spot.key) ?? { ...spot, count: 0, minutes: 0 };
    item.count += 1;
    item.minutes += row.durationMin ?? 0;
    byKey.set(spot.key, item);
  }
  return [...byKey.values()]
    .sort((a, b) => b.count - a.count || b.minutes - a.minutes || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, limit);
}

function mostCited(names: readonly (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const name of names) if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
  return ranked[0]?.[0] ?? null;
}

/**
 * Máquinas com 2 ou mais falhas no período, com o subconjunto mais citado nelas.
 * @example repeatsOf(falhas)[0] // { machineId: "maq_1", label: "Encartuchadeira CAM 05", subassembly: "Esteira de saída", count: 4 }
 */
export function repeatsOf(facts: readonly FailureFact[], limit: number = REPEAT_LIMIT): DashboardRepeatDto[] {
  const byMachine = new Map<string, FailureFact[]>();
  for (const fact of facts) byMachine.set(fact.machineId, [...(byMachine.get(fact.machineId) ?? []), fact]);
  return [...byMachine.values()]
    .filter((group) => group.length >= 2)
    .map((group) => ({
      machineId: group[0].machineId,
      label: group[0].machineLabel,
      subassembly: mostCited(group.map((fact) => fact.subassembly)),
      count: group.length,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, limit);
}

/**
 * Quantas RPs marcaram cada M. Uma RP pode marcar mais de um, então a soma passa do total de RPs.
 * @example fourMOf([{ material: true, machine: true, method: false, labor: false }]) // { rps: 1, material: 1, machine: 1, method: 0, labor: 0 }
 */
export function fourMOf(rps: readonly RpCauseFact[]): DashboardFourMDto {
  const count = (key: keyof RpCauseFact) => rps.filter((rp) => rp[key]).length;
  return { rps: rps.length, material: count("material"), machine: count("machine"), method: count("method"), labor: count("labor") };
}
