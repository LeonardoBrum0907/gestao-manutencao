import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { isTechDocumentKind, type TechDocumentDto, type TechDocumentFields } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";

export type StoredFile = { storageKey: string; fileName: string; mimeType: string; size: number };

const include = { _count: { select: { cards: true } } } satisfies Prisma.TechDocumentInclude;

type Row = Prisma.TechDocumentGetPayload<{ include: typeof include }>;

function toDto(row: Row): TechDocumentDto {
  if (!isTechDocumentKind(row.kind)) throw new DomainError("invalid", 500, `Tipo de documento gravado é inválido: ${row.kind}.`);
  return {
    id: row.id,
    equipmentId: row.equipmentId,
    name: row.name,
    kind: row.kind,
    fileName: row.fileName,
    mimeType: row.mimeType,
    size: row.size,
    revision: row.revision,
    cardCount: row._count.cards,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class TechDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Por modelo, na ordem do nome; sem modelo, todos.
  async list(equipmentId: string | null): Promise<TechDocumentDto[]> {
    const rows = await this.prisma.techDocument.findMany({
      where: equipmentId ? { equipmentId } : {},
      include,
      orderBy: [{ equipmentId: "asc" }, { name: "asc" }],
    });
    return rows.map(toDto);
  }

  async find(id: string): Promise<(TechDocumentDto & { storageKey: string }) | null> {
    const row = await this.prisma.techDocument.findUnique({ where: { id }, include });
    return row ? { ...toDto(row), storageKey: row.storageKey } : null;
  }

  async create(fields: TechDocumentFields, file: StoredFile): Promise<TechDocumentDto> {
    const row = await this.prisma.techDocument.create({ data: { ...fields, ...file }, include });
    return toDto(row);
  }

  async update(id: string, fields: TechDocumentFields): Promise<TechDocumentDto> {
    const row = await this.prisma.techDocument.update({ where: { id }, data: fields, include });
    return toDto(row);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.techDocument.delete({ where: { id } });
  }

  equipmentExists(id: string): Promise<boolean> {
    return this.prisma.matrixEquipment.findUnique({ where: { id }, select: { id: true } }).then(Boolean);
  }
}
