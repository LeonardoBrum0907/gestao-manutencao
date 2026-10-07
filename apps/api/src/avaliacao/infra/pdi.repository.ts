import { Injectable } from "@nestjs/common";
import type { AttachmentDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { PdiLines } from "../domain/pdi";

function toAttachment(row: { id: string; fileName: string; mimeType: string; createdAt: Date }): AttachmentDto {
  return { id: row.id, fileName: row.fileName, mimeType: row.mimeType, createdAt: row.createdAt.toISOString() };
}

@Injectable()
export class PdiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async lines(memberId: string): Promise<PdiLines> {
    const rows = await this.prisma.memberLine.findMany({ where: { memberId } });
    return {
      sponsor: rows.filter((row) => row.kind === "sponsor").map((row) => row.lineId),
      development: rows.filter((row) => row.kind === "development").map((row) => row.lineId),
    };
  }

  async replaceLines(memberId: string, lines: PdiLines): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.memberLine.deleteMany({ where: { memberId } }),
      this.prisma.memberLine.createMany({
        data: [
          ...lines.sponsor.map((lineId) => ({ memberId, lineId, kind: "sponsor" })),
          ...lines.development.map((lineId) => ({ memberId, lineId, kind: "development" })),
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
