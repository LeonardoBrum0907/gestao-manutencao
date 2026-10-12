import type { DashboardChamadoDto } from "@manutencao/shared";
import type { ChamadoFact, FailureFact, RpCauseFact } from "../domain/machines";
import type { ChamadoRow, LineRow, MachineRef, ProblemRow, RpRow } from "../infra/overview-read.prisma";

// Fábrica escolhida no filtro: o que tem linha dessa fábrica entra; sem filtro entra tudo.
export type FactoryScope = { factoryId: string | null; lineIds: ReadonlySet<string> };

/**
 * Monta o escopo da fábrica a partir das linhas cadastradas.
 * @example factoryScope(linhas, "fab_2").lineIds // Set { "cam05", "cam08" }
 */
export function factoryScope(lines: readonly LineRow[], factoryId: string | null): FactoryScope {
  return { factoryId, lineIds: new Set(lines.filter((line) => line.factoryId === factoryId).map((line) => line.id)) };
}

/** Linha (por id) dentro da fábrica do filtro. Sem filtro, tudo passa; sem linha, só passa sem filtro. */
export function lineInScope(scope: FactoryScope, lineId: string | null): boolean {
  if (scope.factoryId === null) return true;
  return lineId !== null && scope.lineIds.has(lineId);
}

/** "Encartuchadeira CAM 05": nome da máquina com a linha, como nas outras telas. */
export function machineLabel(machine: MachineRef): string | null {
  return machine ? `${machine.name} ${machine.line.name}` : null;
}

function openedAtOf(row: ChamadoRow): Date {
  return row.openedAt ?? row.occurredAt;
}

/**
 * Chamados ainda não liberados, do aberto há mais tempo para o mais novo.
 * @example openChamadoList(linhas, nomes) // [{ id, dayNumber: 2, lineName: "CAM 05", machineName: "Encartuchadeira", openedAt }]
 */
export function openChamadoList(rows: readonly ChamadoRow[], lineNames: ReadonlyMap<string, string>): DashboardChamadoDto[] {
  return rows
    .filter((row) => row.status !== "done")
    .sort((a, b) => openedAtOf(a).getTime() - openedAtOf(b).getTime())
    .map((row) => ({
      id: row.id,
      dayNumber: row.dayNumber,
      body: row.body,
      lineName: row.lineId ? (lineNames.get(row.lineId) ?? null) : null,
      machineName: row.machine?.name ?? null,
      openedAt: openedAtOf(row).toISOString(),
    }));
}

/** Chamados abertos entre `from` (inclusive) e `to` (exclusive), no formato das contas da faixa Máquinas. */
export function chamadoFacts(rows: readonly ChamadoRow[], lineNames: ReadonlyMap<string, string>, from: Date, to: Date): ChamadoFact[] {
  return rows
    .filter((row) => row.occurredAt >= from && row.occurredAt < to)
    .map((row) => ({
      openedAt: openedAtOf(row),
      durationMin: row.durationMin,
      machineId: row.machineId,
      machineLabel: machineLabel(row.machine),
      lineId: row.lineId,
      lineName: row.lineId ? (lineNames.get(row.lineId) ?? null) : null,
    }));
}

type FailureSource = { machineId: string | null; machine: MachineRef; subassembly?: { name: string } | null };

/**
 * Chamados, RPs e problemas com máquina, como falhas para a reincidência. O que não diz a máquina fica de fora.
 * @example failureFacts([chamado], [rp], []) // [{ machineId, machineLabel: "Blistadeira MED 02", subassembly: null }, …]
 */
export function failureFacts(...groups: readonly (readonly FailureSource[])[]): FailureFact[] {
  return groups.flat().flatMap((row) => {
    const label = machineLabel(row.machine);
    if (!row.machineId || !label) return [];
    return [{ machineId: row.machineId, machineLabel: label, subassembly: row.subassembly?.name ?? null }];
  });
}

/** As marcas de 4M de cada RP. */
export function rpCauses(rps: readonly RpRow[]): RpCauseFact[] {
  return rps.map((rp) => ({ material: rp.causeMaterial, machine: rp.causeMachine, method: rp.causeMethod, labor: rp.causeLabor }));
}

/** RP na fábrica do filtro (a RP guarda a fábrica, mesmo sem linha). */
export function rpInScope(scope: FactoryScope, rp: { factoryId: string }): boolean {
  return scope.factoryId === null || rp.factoryId === scope.factoryId;
}

/** Problema na fábrica do filtro, pela linha. */
export function problemInScope(scope: FactoryScope, problem: ProblemRow): boolean {
  return lineInScope(scope, problem.lineId);
}
