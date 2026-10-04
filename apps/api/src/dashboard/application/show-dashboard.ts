import { Injectable } from "@nestjs/common";
import type { DashboardDto } from "@manutencao/shared";
import { buildRecordPanel } from "../domain/panel";
import { DashboardRead } from "../infra/dashboard-read.prisma";

@Injectable()
export class ShowDashboard {
  constructor(private readonly read: DashboardRead) {}

  async execute(now: Date = new Date()): Promise<DashboardDto> {
    const snapshot = await this.read.load();
    const panel = buildRecordPanel(
      snapshot.records,
      {
        machines: new Map(snapshot.machines.map((machine) => [machine.id, machine.name])),
        members: new Map(snapshot.members.map((member) => [member.id, member.name])),
      },
      now,
    );
    return {
      openCount: panel.openCount,
      overdueCount: panel.overdueCount,
      dueTodayCount: panel.dueTodayCount,
      doneCount: panel.doneCount,
      machineCount: snapshot.machines.length,
      activeMemberCount: snapshot.members.filter((member) => member.status === "active").length,
      recent: panel.recent.map((record) => ({
        id: record.id,
        type: record.type,
        body: record.body,
        occurredAt: record.occurredAt.toISOString(),
        status: record.status,
      })),
      machineRanking: panel.machineRanking,
      memberRanking: panel.memberRanking,
    };
  }
}
