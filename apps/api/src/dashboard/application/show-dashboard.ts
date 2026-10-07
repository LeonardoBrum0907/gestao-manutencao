import { Injectable } from "@nestjs/common";
import { isRecordStatus, isRecordType, type DashboardDto, type OverdueCountDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { rankOpen } from "../domain/ranking";
import { DashboardRead } from "../infra/dashboard-read.prisma";

@Injectable()
export class ShowDashboard {
  constructor(private readonly read: DashboardRead) {}

  async overdue(now: Date = new Date()): Promise<OverdueCountDto> {
    return { overdueCount: await this.read.overdueCount(now) };
  }

  async execute(now: Date = new Date()): Promise<DashboardDto> {
    const snapshot = await this.read.load(now);
    return {
      openCount: snapshot.openCount,
      overdueCount: snapshot.overdueCount,
      dueTodayCount: snapshot.dueTodayCount,
      doneCount: snapshot.doneCount,
      lineCount: snapshot.lines.length,
      activeMemberCount: snapshot.members.filter((member) => member.status === "active").length,
      recent: snapshot.recent.map((record) => {
        if (!isRecordType(record.type) || !isRecordStatus(record.status)) {
          throw new DomainError("invalid", 500, "Registro gravado está inválido.");
        }
        return {
          id: record.id,
          type: record.type,
          body: record.body,
          occurredAt: record.occurredAt.toISOString(),
          status: record.status,
        };
      }),
      lineRanking: rankOpen(snapshot.openByLine, new Map(snapshot.lines.map((line) => [line.id, line.name]))),
      memberRanking: rankOpen(snapshot.openByMember, new Map(snapshot.members.map((member) => [member.id, member.name]))),
    };
  }
}
