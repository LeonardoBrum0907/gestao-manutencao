import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { isTechCardType, TECH_CARD_TYPES, type TechCardDto, type TechCardFields, type TechCardHit, type TechCardType } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import { buildSearchText, isExactHit, rankHits, searchTerms } from "../domain/search-text";

// Filtro da busca. Máquina, linha e modelo são alvos: a ficha de um modelo vale para as máquinas dele,
// a de uma linha para as máquinas dela.
export type TechCardFilter = {
  query: string;
  type: TechCardType | null;
  machineId: string | null;
  lineId: string | null;
  equipmentId: string | null;
  subassemblyId: string | null;
  documentId: string | null;
  reviewNeeded: boolean | null;
  limit: number;
};

// Mais do que a tela mostra: a ordenação (exato primeiro) é feita aqui depois de buscar.
const FETCH_CAP = 400;

const include = {
  equipment: { select: { name: true } },
  machine: { select: { name: true, line: { select: { name: true } } } },
  line: { select: { name: true } },
  subassembly: { select: { name: true } },
  document: { select: { name: true } },
} satisfies Prisma.TechCardInclude;

type Row = Prisma.TechCardGetPayload<{ include: typeof include }>;

function readStoredDetails(value: Prisma.JsonValue): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function readStoredType(value: string): TechCardType {
  if (!isTechCardType(value)) throw new DomainError("invalid", 500, `Tipo de ficha gravado é inválido: ${value}.`);
  return value;
}

function toDto(row: Row): TechCardDto {
  return {
    id: row.id,
    type: readStoredType(row.type),
    equipmentId: row.equipmentId,
    machineId: row.machineId,
    lineId: row.lineId,
    subassemblyId: row.subassemblyId,
    code: row.code,
    title: row.title,
    summary: row.summary,
    details: readStoredDetails(row.details),
    deviceTag: row.deviceTag,
    originalTerm: row.originalTerm,
    tags: row.tags,
    documentId: row.documentId,
    page: row.page,
    sheet: row.sheet,
    reviewNeeded: row.reviewNeeded,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function scopeLabel(row: Row): string {
  if (row.machine) return `${row.machine.line.name} · ${row.machine.name}`;
  if (row.line) return `Linha ${row.line.name}`;
  return `Modelo ${row.equipment?.name ?? "?"}`;
}

function toHit(row: Row, query: string): TechCardHit {
  return {
    ...toDto(row),
    scopeLabel: scopeLabel(row),
    subassemblyName: row.subassembly?.name ?? null,
    documentName: row.document?.name ?? null,
    exact: isExactHit(row, query),
  };
}

function data(fields: TechCardFields) {
  return {
    type: fields.type,
    equipmentId: fields.equipmentId,
    machineId: fields.machineId,
    lineId: fields.lineId,
    subassemblyId: fields.subassemblyId,
    code: fields.code,
    title: fields.title,
    summary: fields.summary,
    details: fields.details,
    deviceTag: fields.deviceTag,
    originalTerm: fields.originalTerm,
    tags: fields.tags,
    documentId: fields.documentId,
    page: fields.page,
    sheet: fields.sheet,
    reviewNeeded: fields.reviewNeeded,
    searchText: buildSearchText(fields),
  };
}

const emptyCounts = (): Record<TechCardType, number> => Object.fromEntries(TECH_CARD_TYPES.map((type) => [type, 0])) as Record<TechCardType, number>;

@Injectable()
export class TechCardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(filter: TechCardFilter): Promise<{ hits: TechCardHit[]; total: number }> {
    const where: Prisma.TechCardWhereInput = {
      AND: [
        await this.scopeWhere(filter),
        ...searchTerms(filter.query).map((term) => ({ searchText: { contains: term } })),
        ...(filter.type ? [{ type: filter.type }] : []),
        ...(filter.subassemblyId ? [{ subassemblyId: filter.subassemblyId }] : []),
        ...(filter.documentId ? [{ documentId: filter.documentId }] : []),
        ...(filter.reviewNeeded === null ? [] : [{ reviewNeeded: filter.reviewNeeded }]),
      ],
    };
    const [rows, total] = await Promise.all([
      this.prisma.techCard.findMany({ where, include, orderBy: { updatedAt: "desc" }, take: FETCH_CAP }),
      this.prisma.techCard.count({ where }),
    ]);
    const hits = rankHits(rows.map((row) => toHit(row, filter.query)), filter.query).slice(0, filter.limit);
    return { hits, total };
  }

  // Quantas fichas valem para a máquina, por tipo: as dela, as do modelo e as da linha.
  async countByType(machineId: string): Promise<Record<TechCardType, number>> {
    const where = await this.scopeWhere({ machineId, lineId: null, equipmentId: null });
    const groups = await this.prisma.techCard.groupBy({ by: ["type"], where, _count: { _all: true } });
    const counts = emptyCounts();
    for (const group of groups) if (isTechCardType(group.type)) counts[group.type] = group._count._all;
    return counts;
  }

  private async scopeWhere(scope: Pick<TechCardFilter, "machineId" | "lineId" | "equipmentId">): Promise<Prisma.TechCardWhereInput> {
    if (scope.machineId) return this.machineScope(scope.machineId);
    if (scope.lineId) return this.lineScope(scope.lineId);
    if (scope.equipmentId) return { equipmentId: scope.equipmentId };
    return {};
  }

  private async machineScope(machineId: string): Promise<Prisma.TechCardWhereInput> {
    const machine = await this.prisma.machine.findUnique({ where: { id: machineId }, select: { lineId: true, equipmentId: true } });
    if (!machine) return { machineId };
    return {
      OR: [{ machineId }, { lineId: machine.lineId }, ...(machine.equipmentId ? [{ equipmentId: machine.equipmentId }] : [])],
    };
  }

  private async lineScope(lineId: string): Promise<Prisma.TechCardWhereInput> {
    const machines = await this.prisma.machine.findMany({ where: { lineId }, select: { id: true, equipmentId: true } });
    const equipmentIds = [...new Set(machines.map((machine) => machine.equipmentId).filter((id): id is string => Boolean(id)))];
    return { OR: [{ lineId }, { machineId: { in: machines.map((machine) => machine.id) } }, { equipmentId: { in: equipmentIds } }] };
  }

  async find(id: string): Promise<TechCardHit | null> {
    const row = await this.prisma.techCard.findUnique({ where: { id }, include });
    return row ? toHit(row, "") : null;
  }

  async create(fields: TechCardFields): Promise<TechCardHit> {
    return toHit(await this.prisma.techCard.create({ data: data(fields), include }), "");
  }

  async update(id: string, fields: TechCardFields): Promise<TechCardHit> {
    return toHit(await this.prisma.techCard.update({ where: { id }, data: data(fields), include }), "");
  }

  async remove(id: string): Promise<void> {
    await this.prisma.techCard.delete({ where: { id } });
  }

  // Fichas pós-preventiva que falam do mesmo assunto, para a busca mostrar no fim da lista.
  async matchingPostPreventiveIds(query: string, machineId: string | null, lineId: string | null): Promise<string[]> {
    const terms = searchTerms(query);
    if (!terms.length) return [];
    const text = (term: string): Prisma.PostPreventiveWhereInput => ({
      OR: ["occurrence", "attentionPoint", "done", "preventiveAction"].map((field) => ({ [field]: { contains: term, mode: "insensitive" } })),
    });
    const rows = await this.prisma.postPreventive.findMany({
      where: { AND: [...terms.map(text), ...(machineId ? [{ machineId }] : []), ...(lineId ? [{ machine: { lineId } }] : [])] },
      select: { id: true },
      orderBy: { preventiveDate: "desc" },
      take: 20,
    });
    return rows.map((row) => row.id);
  }

  // ---- Referências para validar uma ficha ----

  findMachine(id: string) {
    return this.prisma.machine.findUnique({ where: { id }, select: { id: true, lineId: true, equipmentId: true } });
  }

  lineExists(id: string): Promise<boolean> {
    return this.prisma.line.findUnique({ where: { id }, select: { id: true } }).then(Boolean);
  }

  equipmentExists(id: string): Promise<boolean> {
    return this.prisma.matrixEquipment.findUnique({ where: { id }, select: { id: true } }).then(Boolean);
  }

  findSubassembly(id: string) {
    return this.prisma.subassembly.findUnique({ where: { id }, select: { id: true, equipmentId: true, archived: true } });
  }

  findDocumentModel(id: string) {
    return this.prisma.techDocument.findUnique({ where: { id }, select: { id: true, equipmentId: true } });
  }
}
