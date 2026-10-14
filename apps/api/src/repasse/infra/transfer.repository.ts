import { Injectable } from "@nestjs/common";
import type { TransferCreateBody } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { MemberChangeRow, MemberScoreRow, TransferRow, TransferStore } from "../application/transfer-store";
import type { TransferMember } from "../domain/transfer-rules";

const TRANSFER_SELECT = { id: true, teacherId: true, learnerId: true, equipmentIds: true, status: true, startedAt: true, closedAt: true } as const;
const MEMBER_SELECT = { id: true, name: true, position: true, status: true, team: { select: { name: true } } } as const;
// Item de PDI ainda aberto: planejado ou em andamento.
const OPEN_PDI_STATUSES = ["planned", "in_progress"];

type MemberSelected = { id: string; name: string; position: string; status: string; team: { name: string } | null };

function toMember({ team, ...member }: MemberSelected): TransferMember {
  return { ...member, teamName: team?.name ?? null };
}

@Injectable()
export class TransferRepository implements TransferStore {
  constructor(private readonly prisma: PrismaService) {}

  transfers(): Promise<TransferRow[]> {
    return this.prisma.knowledgeTransfer.findMany({ select: TRANSFER_SELECT, orderBy: { startedAt: "desc" } });
  }

  transfer(id: string): Promise<TransferRow | null> {
    return this.prisma.knowledgeTransfer.findUnique({ where: { id }, select: TRANSFER_SELECT });
  }

  create(input: TransferCreateBody): Promise<TransferRow> {
    return this.prisma.knowledgeTransfer.create({ data: input, select: TRANSFER_SELECT });
  }

  async close(id: string, at: Date): Promise<void> {
    await this.prisma.knowledgeTransfer.update({ where: { id }, data: { status: "closed", closedAt: at } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.knowledgeTransfer.delete({ where: { id } });
  }

  async members(ids: readonly string[]): Promise<TransferMember[]> {
    const rows = await this.prisma.member.findMany({ where: { id: { in: [...ids] } }, select: MEMBER_SELECT });
    return rows.map(toMember);
  }

  async technicians(): Promise<TransferMember[]> {
    const rows = await this.prisma.member.findMany({ where: { position: "technician", status: "active" }, select: MEMBER_SELECT, orderBy: { name: "asc" } });
    return rows.map(toMember);
  }

  scores(memberIds: readonly string[]): Promise<MemberScoreRow[]> {
    return this.prisma.memberSkill.findMany({
      where: { memberId: { in: [...memberIds] } },
      select: { memberId: true, skillId: true, score: true, notApplicable: true },
    });
  }

  async matrixEquipments(memberId: string): Promise<string[]> {
    const rows = await this.prisma.memberMatrixEquipment.findMany({ where: { memberId }, select: { equipmentId: true } });
    return rows.map((row) => row.equipmentId);
  }

  history(memberIds: readonly string[]): Promise<MemberChangeRow[]> {
    return this.prisma.memberSkillHistory.findMany({
      where: { memberId: { in: [...memberIds] } },
      select: { memberId: true, skillId: true, score: true, notApplicable: true, changedAt: true },
      orderBy: { changedAt: "asc" },
    });
  }

  async openPdiItems(memberId: string, skillIds: readonly string[]): Promise<{ id: string; skillId: string }[]> {
    const rows = await this.prisma.memberPdiItem.findMany({
      where: { memberId, skillId: { in: [...skillIds] }, status: { in: OPEN_PDI_STATUSES } },
      select: { id: true, skillId: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.flatMap((row) => (row.skillId ? [{ id: row.id, skillId: row.skillId }] : []));
  }
}
