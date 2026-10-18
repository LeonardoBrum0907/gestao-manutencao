import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { isRpRevisionKind, type PublicRpFields, type RpRevisionDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { isRecord } from "../../kernel/parse";
import { PrismaService } from "../../prisma/prisma.service";
import type { RevisionWrite, RpRevisionStore } from "../application/ports";

type Row = { id: string; rpId: string; kind: string; before: Prisma.JsonValue; note: string | null; createdAt: Date };

// O "antes" é gravado por esta API; a restauração passa de novo pela leitura do RP, que confere cada campo.
function toDto(row: Row): RpRevisionDto {
  if (!isRpRevisionKind(row.kind) || !isRecord(row.before)) {
    throw new DomainError("invalid", 500, `Histórico do RP gravado está inválido (linha ${row.id}, tipo ${row.kind}).`);
  }
  return { id: row.id, rpId: row.rpId, kind: row.kind, note: row.note, before: row.before as PublicRpFields, createdAt: row.createdAt.toISOString() };
}

@Injectable()
export class RpRevisionRepository implements RpRevisionStore {
  constructor(private readonly prisma: PrismaService) {}

  async add(write: RevisionWrite): Promise<RpRevisionDto> {
    const row = await this.prisma.rpRevision.create({
      data: { rpId: write.rpId, kind: write.kind, before: write.before as Prisma.InputJsonValue, note: write.note },
    });
    return toDto(row);
  }

  async list(rpId: string): Promise<RpRevisionDto[]> {
    const rows = await this.prisma.rpRevision.findMany({ where: { rpId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
    return rows.map(toDto);
  }

  async find(id: string): Promise<RpRevisionDto | null> {
    const row = await this.prisma.rpRevision.findUnique({ where: { id } });
    return row ? toDto(row) : null;
  }
}
