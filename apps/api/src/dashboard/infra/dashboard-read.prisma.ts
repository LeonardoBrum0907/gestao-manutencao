import { Injectable } from "@nestjs/common";
import { dueRange } from "../../registro/domain/follow-up";
import { PrismaService } from "../../prisma/prisma.service";
import { RECENT_LIMIT } from "../domain/ranking";

export type DashboardSnapshot = {
  openCount: number;
  overdueCount: number;
  dueTodayCount: number;
  doneCount: number;
  recent: { id: string; type: string; body: string; occurredAt: Date; status: string }[];
  lines: { id: string; name: string }[];
  members: { id: string; name: string; status: string }[];
  openByLine: { id: string; openCount: number }[];
  openByMember: { id: string; openCount: number }[];
};

// Contagens, ranking e "recentes" saem do banco já somados: antes a API lia todos os registros, com o texto, só para contar.
@Injectable()
export class DashboardRead {
  constructor(private readonly prisma: PrismaService) {}

  overdueCount(now: Date): Promise<number> {
    return this.prisma.record.count({ where: { type: "task", status: { not: "done" }, dueAt: dueRange("overdue", now) } });
  }

  async load(now: Date): Promise<DashboardSnapshot> {
    const notDone = { status: { not: "done" } } as const;
    const [openCount, overdueCount, dueTodayCount, doneCount, recent, lines, members, byLine, byMember] = await Promise.all([
      this.prisma.record.count({ where: { status: "open" } }),
      this.prisma.record.count({ where: { type: "task", ...notDone, dueAt: dueRange("overdue", now) } }),
      this.prisma.record.count({ where: { type: "task", ...notDone, dueAt: dueRange("today", now) } }),
      this.prisma.record.count({ where: { status: "done" } }),
      this.prisma.record.findMany({
        select: { id: true, type: true, body: true, occurredAt: true, status: true },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: RECENT_LIMIT,
      }),
      this.prisma.line.findMany({ select: { id: true, name: true } }),
      this.prisma.member.findMany({ select: { id: true, name: true, status: true } }),
      this.prisma.record.groupBy({ by: ["lineId"], where: { status: "open", lineId: { not: null } }, _count: { _all: true } }),
      this.prisma.record.groupBy({ by: ["memberId"], where: { status: "open", memberId: { not: null } }, _count: { _all: true } }),
    ]);
    return {
      openCount,
      overdueCount,
      dueTodayCount,
      doneCount,
      recent,
      lines,
      members,
      openByLine: byLine.flatMap((row) => (row.lineId ? [{ id: row.lineId, openCount: row._count._all }] : [])),
      openByMember: byMember.flatMap((row) => (row.memberId ? [{ id: row.memberId, openCount: row._count._all }] : [])),
    };
  }
}
