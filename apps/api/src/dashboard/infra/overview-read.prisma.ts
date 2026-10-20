import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { dueRange } from "../../registro/domain/follow-up";
import { PrismaService } from "../../prisma/prisma.service";
import type { QuarterRef } from "../domain/people";

const chamado = { origin: "chamado" } as const;
const machineSelect = { select: { name: true, line: { select: { name: true } } } } as const;

export type LineRow = { id: string; name: string; factoryId: string; status: string };
export type MachineRef = { name: string; line: { name: string } } | null;
export type ChamadoRow = {
  id: string;
  dayNumber: number | null;
  body: string;
  status: string;
  lineId: string | null;
  // Linha escrita à mão no chamado ("outra", fora do cadastro).
  lineLabel: string | null;
  openedAt: Date | null;
  occurredAt: Date;
  durationMin: number | null;
  machineId: string | null;
  machine: MachineRef;
};
export type RpRow = {
  factoryId: string;
  lineId: string | null;
  machineId: string | null;
  machine: MachineRef;
  subassembly: { name: string } | null;
  causeMaterial: boolean;
  causeMachine: boolean;
  causeMethod: boolean;
  causeLabor: boolean;
};
export type ProblemRow = { lineId: string | null; machineId: string | null; machine: MachineRef; subassembly: { name: string } | null };

// Leituras do Dashboard do coordenador. Cada uma traz só as colunas que a conta usa; os volumes são pequenos
// (centenas de chamados em 90 dias), então o filtro de fábrica e as somas ficam no Node, em funções testadas.
@Injectable()
export class OverviewRead {
  constructor(private readonly prisma: PrismaService) {}

  lines(): Promise<LineRow[]> {
    return this.prisma.line.findMany({ select: { id: true, name: true, factoryId: true, status: true }, orderBy: { name: "asc" } });
  }

  // Chamados ainda abertos ou em andamento, mais os do período (e do período anterior, para comparar).
  chamados(since: Date): Promise<ChamadoRow[]> {
    return this.prisma.record.findMany({
      where: { ...chamado, OR: [{ status: { not: "done" } }, { occurredAt: { gte: since } }] },
      select: {
        id: true,
        dayNumber: true,
        body: true,
        status: true,
        lineId: true,
        lineLabel: true,
        openedAt: true,
        occurredAt: true,
        durationMin: true,
        machineId: true,
        machine: machineSelect,
      },
      orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
    });
  }

  async taskCounts(now: Date): Promise<{ overdue: number; overdueHigh: number; dueToday: number }> {
    const pending = { type: "task", status: { not: "done" } } as const;
    const [overdue, overdueHigh, dueToday] = await Promise.all([
      this.prisma.record.count({ where: { ...pending, dueAt: dueRange("overdue", now) } }),
      this.prisma.record.count({ where: { ...pending, priority: "high", dueAt: dueRange("overdue", now) } }),
      this.prisma.record.count({ where: { ...pending, dueAt: dueRange("today", now) } }),
    ]);
    return { overdue, overdueHigh, dueToday };
  }

  async drafts(): Promise<{ count: number; oldest: Date | null }> {
    const where = { type: "entry", status: { not: "done" } } as const;
    const [count, oldest] = await Promise.all([
      this.prisma.record.count({ where }),
      this.prisma.record.findFirst({ where, select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
    ]);
    return { count, oldest: oldest?.createdAt ?? null };
  }

  rpsInAnalysis(): Promise<{ factoryId: string; rootCause: string | null }[]> {
    return this.prisma.rp.findMany({ where: { status: "analysis" }, select: { factoryId: true, rootCause: true } });
  }

  // RP da página pública só entra no Pareto depois que o coordenador confere (sem login, pode chegar errado).
  rpsSince(since: Date): Promise<(RpRow & { occurredAt: Date })[]> {
    return this.prisma.rp.findMany({
      where: { occurredAt: { gte: since }, NOT: { source: "public", checkedAt: null } },
      select: {
        occurredAt: true,
        factoryId: true,
        lineId: true,
        machineId: true,
        machine: machineSelect,
        subassembly: { select: { name: true } },
        causeMaterial: true,
        causeMachine: true,
        causeMethod: true,
        causeLabor: true,
      },
    });
  }

  // Problemas lançados à mão (Entrada) ou de ocorrência: o espelho da RP já conta pela RP, e chamado tem leitura própria.
  problemsSince(since: Date): Promise<ProblemRow[]> {
    return this.prisma.record.findMany({
      where: { type: "problem", origin: { notIn: ["rp", "chamado"] }, occurredAt: { gte: since } },
      select: { lineId: true, machineId: true, machine: machineSelect, subassembly: { select: { name: true } } },
    });
  }

  // Tarefas e problemas que entraram ou foram concluídos desde a data (chamado e rascunho ficam de fora).
  async flow(since: Date): Promise<{ created: Date[]; completed: Date[] }> {
    const kinds: Prisma.RecordWhereInput = { type: { in: ["task", "problem"] }, origin: { not: "chamado" } };
    const [created, completed] = await Promise.all([
      this.prisma.record.findMany({ where: { ...kinds, createdAt: { gte: since } }, select: { createdAt: true } }),
      this.prisma.record.findMany({ where: { ...kinds, completedAt: { gte: since } }, select: { completedAt: true } }),
    ]);
    return {
      created: created.map((row) => row.createdAt),
      completed: completed.flatMap((row) => (row.completedAt ? [row.completedAt] : [])),
    };
  }

  technicians(): Promise<{ id: string; name: string }[]> {
    return this.prisma.member.findMany({ where: { position: "technician", status: "active" }, select: { id: true, name: true } });
  }

  away(): Promise<{ id: string; name: string; status: string }[]> {
    return this.prisma.member.findMany({
      where: { status: { in: ["vacation", "away"] } },
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
    });
  }

  quarterScores(ref: QuarterRef): Promise<{ memberId: string; score: number }[]> {
    return this.prisma.memberEvaluation.findMany({ where: ref, select: { memberId: true, score: true } });
  }

  async lastFeedback(): Promise<Map<string, Date>> {
    const rows = await this.prisma.record.groupBy({
      by: ["memberId"],
      where: { type: "feedback", memberId: { not: null } },
      _max: { occurredAt: true },
    });
    return new Map(rows.flatMap((row) => (row.memberId && row._max.occurredAt ? [[row.memberId, row._max.occurredAt]] : [])));
  }
}
