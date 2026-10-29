import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  isRpSource,
  isRpStatus,
  type RpDto,
  type RpDuplicateDto,
  type RpFields,
  type RpListItemDto,
  type RpPageDto,
  type RpPublicDecision,
  type RpSource,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import type { RpListFilter } from "../domain/rp-list";
import { normalizeOrder, normalizeProblem } from "../domain/rp";
import type { RpDecisionPatch } from "../domain/rp-decision";
import type { RpStore, RpWrite } from "../application/rp-store";

const include = { members: { orderBy: { position: "asc" as const } } };

type Row = Prisma.RpGetPayload<{ include: typeof include }>;

function status(value: string) {
  if (!isRpStatus(value)) throw new DomainError("invalid", 500, "Status gravado está inválido.");
  return value;
}

function source(value: string): RpSource {
  if (!isRpSource(value)) throw new DomainError("invalid", 500, `Origem gravada está inválida (recebido: ${value}; esperado: paste ou public).`);
  return value;
}

function toDto(row: Row): RpDto {
  return {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    orderNumber: row.orderNumber,
    factoryId: row.factoryId,
    lineId: row.lineId,
    line: row.line,
    tag: row.tag,
    machineId: row.machineId,
    subassemblyId: row.subassemblyId,
    problem: row.problem,
    description: row.description,
    repeatedFailure: row.repeatedFailure,
    repeatedTimes: row.repeatedTimes,
    repeatedPeriod: row.repeatedPeriod,
    causes: {
      material: { marked: row.causeMaterial, text: row.materialText },
      machine: { marked: row.causeMachine, text: row.machineText },
      method: { marked: row.causeMethod, text: row.methodText },
      labor: { marked: row.causeLabor, text: row.laborText },
    },
    rootCause: row.rootCause,
    corrective: row.corrective,
    preventive: row.preventive,
    status: status(row.status),
    basicConditionImpact: row.basicConditionImpact,
    memberIds: row.members.map((link) => link.memberId),
    unmatchedTechnicians: row.unmatchedTechnicians,
    problemRecordId: row.problemRecordId,
    chamadoId: row.chamadoId,
    rawText: row.rawText,
    source: source(row.source),
    checkedAt: row.checkedAt?.toISOString() ?? null,
    reviewRequest: row.reviewRequest,
    reviewRequestedAt: row.reviewRequestedAt?.toISOString() ?? null,
    rejectedAt: row.rejectedAt?.toISOString() ?? null,
    rejectionNote: row.rejectionNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const listSelect = {
  id: true,
  occurredAt: true,
  line: true,
  tag: true,
  lineId: true,
  problem: true,
  status: true,
  repeatedFailure: true,
  unmatchedTechnicians: true,
  source: true,
  checkedAt: true,
  reviewRequestedAt: true,
  rejectedAt: true,
  members: { select: { memberId: true }, orderBy: { position: "asc" as const } },
} satisfies Prisma.RpSelect;

function toListItem(row: Prisma.RpGetPayload<{ select: typeof listSelect }>): RpListItemDto {
  return {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    line: row.line,
    tag: row.tag,
    lineId: row.lineId,
    problem: row.problem,
    status: status(row.status),
    repeatedFailure: row.repeatedFailure,
    memberIds: row.members.map((link) => link.memberId),
    unmatchedTechnicians: row.unmatchedTechnicians,
    source: source(row.source),
    checked: row.checkedAt !== null,
    reviewRequested: row.reviewRequestedAt !== null,
    rejected: row.rejectedAt !== null,
  };
}

function scalars(write: RpWrite) {
  const { fields } = write;
  return {
    occurredAt: write.occurredAt,
    orderNumber: fields.orderNumber,
    orderKey: normalizeOrder(fields.orderNumber),
    factoryId: fields.factoryId,
    lineId: fields.lineId,
    line: fields.line,
    tag: fields.tag,
    machineId: fields.machineId,
    subassemblyId: fields.subassemblyId,
    problem: fields.problem,
    problemKey: normalizeProblem(fields.problem),
    description: fields.description,
    repeatedFailure: fields.repeatedFailure,
    repeatedTimes: fields.repeatedFailure ? fields.repeatedTimes : null,
    repeatedPeriod: fields.repeatedFailure ? fields.repeatedPeriod : null,
    causeMaterial: fields.causes.material.marked,
    materialText: fields.causes.material.text,
    causeMachine: fields.causes.machine.marked,
    machineText: fields.causes.machine.text,
    causeMethod: fields.causes.method.marked,
    methodText: fields.causes.method.text,
    causeLabor: fields.causes.labor.marked,
    laborText: fields.causes.labor.text,
    rootCause: fields.rootCause,
    corrective: fields.corrective,
    preventive: fields.preventive,
    status: fields.status,
    basicConditionImpact: fields.basicConditionImpact,
    unmatchedTechnicians: fields.unmatchedTechnicians,
    rawText: write.rawText,
    problemRecordId: write.problemRecordId,
  };
}

function memberRows(ids: string[]) {
  return ids.map((memberId, position) => ({ memberId, position }));
}

function dayStart(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

function listWhere(filter: RpListFilter): Prisma.RpWhereInput {
  const and: Prisma.RpWhereInput[] = [];
  if (filter.from) and.push({ occurredAt: { gte: dayStart(filter.from) } });
  if (filter.to) and.push({ occurredAt: { lt: new Date(dayStart(filter.to).getTime() + 24 * 60 * 60 * 1000) } });
  if (filter.factoryId) and.push({ factoryId: filter.factoryId });
  if (filter.lineId) and.push({ lineId: filter.lineId });
  if (filter.line) and.push({ line: { contains: filter.line, mode: "insensitive" } });
  if (filter.tag) and.push({ tag: { contains: filter.tag, mode: "insensitive" } });
  if (filter.statuses) and.push({ status: { in: filter.statuses } });
  if (filter.memberId) and.push({ members: { some: { memberId: filter.memberId } } });
  if (filter.repeated !== null) and.push({ repeatedFailure: filter.repeated });
  if (filter.source) and.push({ source: filter.source });
  if (filter.reviewPending) and.push({ reviewRequestedAt: { not: null } });
  if (filter.checked !== null) and.push({ checkedAt: filter.checked ? { not: null } : null });
  if (filter.decision) and.push(decisionWhere(filter.decision));
  if (filter.q) {
    const contains = { contains: filter.q, mode: "insensitive" as const };
    and.push({ OR: [{ problem: contains }, { description: contains }, { rootCause: contains }] });
  }
  return { AND: and };
}

// Mesma ordem de rpPublicDecisionOf: pedido de revisão, recusa, aprovação.
function decisionWhere(decision: RpPublicDecision): Prisma.RpWhereInput {
  if (decision === "revision") return { reviewRequestedAt: { not: null } };
  if (decision === "rejected") return { reviewRequestedAt: null, rejectedAt: { not: null } };
  if (decision === "approved") return { reviewRequestedAt: null, rejectedAt: null, checkedAt: { not: null } };
  return { reviewRequestedAt: null, rejectedAt: null, checkedAt: null };
}

@Injectable()
export class RpRepository implements RpStore {
  constructor(private readonly prisma: PrismaService) {}

  async find(id: string): Promise<RpDto | null> {
    const row = await this.prisma.rp.findUnique({ where: { id }, include });
    return row ? toDto(row) : null;
  }

  // Chamado que pode receber o RP: existe e ainda não tem RP.
  async chamadoFree(chamadoId: string): Promise<"missing" | "taken" | "free"> {
    const row = await this.prisma.record.findFirst({
      where: { id: chamadoId, origin: "chamado" },
      select: { rpOfChamado: { select: { id: true } } },
    });
    if (!row) return "missing";
    return row.rpOfChamado ? "taken" : "free";
  }

  async idByProblem(problemRecordId: string): Promise<string | null> {
    const row = await this.prisma.rp.findUnique({ where: { problemRecordId }, select: { id: true } });
    return row ? row.id : null;
  }

  // O chamado de origem só se liga na criação ("Escrever RP" no chamado); editar o RP não mexe nele.
  async insert(write: RpWrite, chamadoId: string | null = null, origin: RpSource = "paste"): Promise<RpDto> {
    const row = await this.prisma.rp.create({
      data: { ...scalars(write), chamadoId, source: origin, members: { create: memberRows(write.fields.memberIds) } },
      include,
    });
    return toDto(row);
  }

  async update(id: string, write: RpWrite): Promise<RpDto> {
    const row = await this.prisma.rp.update({
      where: { id },
      data: { ...scalars(write), members: { deleteMany: {}, create: memberRows(write.fields.memberIds) } },
      include,
    });
    return toDto(row);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.rp.delete({ where: { id } });
  }

  // Conferido, pedido de revisão: grava só as chaves que vierem no patch.
  async setDecision(id: string, patch: RpDecisionPatch): Promise<RpDto> {
    const row = await this.prisma.rp.update({ where: { id }, data: patch, include });
    return toDto(row);
  }

  async listPage(filter: RpListFilter): Promise<RpPageDto> {
    const rows = await this.prisma.rp.findMany({
      where: listWhere(filter),
      select: listSelect,
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: filter.limit + 1,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });
    const items = rows.slice(0, filter.limit);
    return {
      items: items.map(toListItem),
      nextCursor: rows.length > filter.limit ? items[items.length - 1]!.id : null,
    };
  }

  async memberSummary(memberId: string, limit: number) {
    const where = { members: { some: { memberId } } } satisfies Prisma.RpWhereInput;
    const [count, rows] = await Promise.all([
      this.prisma.rp.count({ where }),
      this.prisma.rp.findMany({ where, select: listSelect, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take: limit }),
    ]);
    return { count, items: rows.map(toListItem) };
  }

  // Mesma ordem, ou mesmo problema no mesmo dia na mesma linha (ou mesma TAG, sem linha cadastrada).
  async duplicates(fields: RpFields, occurredAt: Date, excludeId: string | null): Promise<RpDuplicateDto[]> {
    const orderKey = normalizeOrder(fields.orderNumber);
    const problemKey = normalizeProblem(fields.problem);
    const dayFrom = new Date(Date.UTC(occurredAt.getUTCFullYear(), occurredAt.getUTCMonth(), occurredAt.getUTCDate()));
    const dayTo = new Date(dayFrom.getTime() + 24 * 60 * 60 * 1000);
    const where: Prisma.RpWhereInput[] = [];
    if (orderKey) where.push({ orderKey });
    const place = fields.lineId ? { lineId: fields.lineId } : fields.tag ? { tag: { equals: fields.tag, mode: "insensitive" as const } } : null;
    if (problemKey && place) where.push({ problemKey, occurredAt: { gte: dayFrom, lt: dayTo }, ...place });
    if (!where.length) return [];
    const rows = await this.prisma.rp.findMany({
      where: { AND: [{ OR: where }, excludeId ? { id: { not: excludeId } } : {}] },
      select: { id: true, occurredAt: true, line: true, tag: true, problem: true, orderKey: true },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: 10,
    });
    return rows.map((row) => ({
      id: row.id,
      occurredAt: row.occurredAt.toISOString(),
      line: row.line,
      tag: row.tag,
      problem: row.problem,
      reason: orderKey && row.orderKey === orderKey ? "order" : "same_problem",
    }));
  }
}
