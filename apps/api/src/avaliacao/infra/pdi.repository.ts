import { Injectable } from "@nestjs/common";
import type { AttachmentDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { PdiMachines } from "../domain/pdi";

function toAttachment(row: { id: string; fileName: string; mimeType: string; createdAt: Date }): AttachmentDto {
  return { id: row.id, fileName: row.fileName, mimeType: row.mimeType, createdAt: row.createdAt.toISOString() };
}

@Injectable()
export class PdiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async machines(memberId: string): Promise<PdiMachines> {
    const rows = await this.prisma.memberMachine.findMany({ where: { memberId } });
    return {
      sponsor: rows.filter((row) => row.kind === "sponsor").map((row) => row.machineId),
      development: rows.filter((row) => row.kind === "development").map((row) => row.machineId),
    };
  }

  async replaceMachines(memberId: string, machines: PdiMachines): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.memberMachine.deleteMany({ where: { memberId } }),
      this.prisma.memberMachine.createMany({
        data: [
          ...machines.sponsor.map((machineId) => ({ memberId, machineId, kind: "sponsor" })),
          ...machines.development.map((machineId) => ({ memberId, machineId, kind: "development" })),
        ],
      }),
    ]);
  }

  async attachments(memberId: string): Promise<AttachmentDto[]> {
    const rows = await this.prisma.memberAttachment.findMany({ where: { memberId }, orderBy: { createdAt: "asc" } });
    return rows.map(toAttachment);
  }

  async addAttachment(memberId: string, stored: { storageKey: string; fileName: string; mimeType: string }): Promise<AttachmentDto> {
    return toAttachment(await this.prisma.memberAttachment.create({ data: { memberId, ...stored } }));
  }

  findAttachment(memberId: string, id: string) {
    return this.prisma.memberAttachment.findFirst({ where: { id, memberId } });
  }

  async removeAttachment(id: string): Promise<void> {
    await this.prisma.memberAttachment.delete({ where: { id } });
  }
}
