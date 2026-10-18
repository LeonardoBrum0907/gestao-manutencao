import type { PublicRpDirectoryDto, RpDto, RpListItemDto, RpPageDto, RpPublicLinkDto, RpRevisionDto, RpSource, RpSupervisorLinkDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import type { RpInput } from "../../rp/application/parse-rp";
import type { RpListQuery } from "../../rp/application/parse-rp-list";
import type { RpDecisionPatch } from "../../rp/domain/rp-decision";
import type { PublicDirectoryStore, PublicLinkStore, RevisionWrite, RpBook, RpRevisionStore, SupervisorLinkStore } from "./ports";

// Classes falsas dos testes da página pública: guardam tudo em memória.

const noCause = { marked: false, text: null };

export function sampleRp(patch: Partial<RpDto> = {}): RpDto {
  return {
    id: "rp1",
    occurredAt: "2026-10-04T12:00:00.000Z",
    orderNumber: null,
    factoryId: "f1",
    lineId: "l1",
    line: "Cam 08",
    tag: "EBS-BLI-31",
    machineId: "mq1",
    subassemblyId: "sub1",
    problem: "Alarme de posição",
    description: null,
    repeatedFailure: false,
    repeatedTimes: null,
    repeatedPeriod: null,
    causes: { material: noCause, machine: noCause, method: noCause, labor: noCause },
    rootCause: null,
    corrective: null,
    preventive: null,
    status: "analysis",
    basicConditionImpact: null,
    memberIds: ["m1"],
    unmatchedTechnicians: null,
    problemRecordId: "rec1",
    chamadoId: null,
    rawText: "",
    source: "public",
    checkedAt: null,
    reviewRequest: null,
    reviewRequestedAt: null,
    rejectedAt: null,
    rejectionNote: null,
    createdAt: "2026-10-04T12:00:00.000Z",
    updatedAt: "2026-10-04T12:00:00.000Z",
    ...patch,
  };
}

function listItem(rp: RpDto): RpListItemDto {
  return {
    id: rp.id, occurredAt: rp.occurredAt, line: rp.line, tag: rp.tag, lineId: rp.lineId, problem: rp.problem, status: rp.status,
    repeatedFailure: rp.repeatedFailure, memberIds: rp.memberIds, unmatchedTechnicians: rp.unmatchedTechnicians, source: rp.source,
    checked: rp.checkedAt !== null, reviewRequested: rp.reviewRequestedAt !== null, rejected: rp.rejectedAt !== null,
  };
}

export class FakeRpBook implements RpBook {
  rows: RpDto[] = [];
  queries: RpListQuery[] = [];
  private next = 1;

  async get(id: string): Promise<RpDto> {
    const row = this.rows.find((item) => item.id === id);
    if (!row) throw new DomainError("not_found", 404, "RP não encontrado.");
    return row;
  }

  async page(query: RpListQuery): Promise<RpPageDto> {
    this.queries.push(query);
    return { items: this.rows.filter((row) => !query.source || row.source === query.source).map(listItem), nextCursor: null };
  }

  async createFrom(input: RpInput, origin: RpSource): Promise<RpDto> {
    const row = sampleRp({ ...input.fields, id: `novo${this.next++}`, source: origin, rawText: input.rawText });
    this.rows.push(row);
    return row;
  }

  async updateFrom(id: string, input: RpInput): Promise<RpDto> {
    return this.patch(id, { ...input.fields, rawText: input.rawText });
  }

  async setDecision(id: string, patch: RpDecisionPatch): Promise<RpDto> {
    const dates = Object.entries(patch).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]);
    return this.patch(id, Object.fromEntries(dates) as Partial<RpDto>);
  }

  private async patch(id: string, patch: Partial<RpDto>): Promise<RpDto> {
    const row = { ...(await this.get(id)), ...patch };
    this.rows = this.rows.map((item) => (item.id === id ? row : item));
    return row;
  }
}

export class FakePublicLinkStore implements PublicLinkStore {
  links: Array<RpPublicLinkDto & { revokedAt: string | null }> = [];

  async active(): Promise<RpPublicLinkDto | null> {
    const link = this.links.find((item) => item.revokedAt === null);
    return link ? { code: link.code, createdAt: link.createdAt } : null;
  }

  async isActive(code: string): Promise<boolean> {
    return this.links.some((item) => item.code === code && item.revokedAt === null);
  }

  async replace(code: string, at: Date): Promise<RpPublicLinkDto> {
    await this.revokeAll(at);
    this.links.push({ code, createdAt: at.toISOString(), revokedAt: null });
    return { code, createdAt: at.toISOString() };
  }

  async revokeAll(at: Date): Promise<void> {
    this.links = this.links.map((item) => (item.revokedAt ? item : { ...item, revokedAt: at.toISOString() }));
  }
}

export class FakeSupervisorLinkStore implements SupervisorLinkStore {
  links: Array<RpSupervisorLinkDto & { revokedAt: string | null }> = [];

  async list(): Promise<RpSupervisorLinkDto[]> {
    return this.links.filter((link) => !link.revokedAt).map(({ revokedAt: _revoked, ...link }) => link);
  }

  async create(name: string, code: string, at: Date): Promise<RpSupervisorLinkDto> {
    const link = { id: `sup${this.links.length + 1}`, name, code, createdAt: at.toISOString() };
    this.links.push({ ...link, revokedAt: null });
    return link;
  }

  async replaceCode(id: string, code: string): Promise<RpSupervisorLinkDto | null> {
    const link = this.links.find((item) => item.id === id && !item.revokedAt);
    if (!link) return null;
    link.code = code;
    return (await this.list()).find((item) => item.id === id) ?? null;
  }

  async revoke(id: string, at: Date): Promise<boolean> {
    const link = this.links.find((item) => item.id === id && !item.revokedAt);
    if (!link) return false;
    link.revokedAt = at.toISOString();
    return true;
  }

  async findActive(code: string): Promise<{ id: string; name: string } | null> {
    const link = this.links.find((item) => item.code === code && !item.revokedAt);
    return link ? { id: link.id, name: link.name } : null;
  }
}

export class FakeRpRevisionStore implements RpRevisionStore {
  rows: RpRevisionDto[] = [];

  async add(write: RevisionWrite): Promise<RpRevisionDto> {
    const row = { ...write, actorName: write.actorName ?? null, id: `rev${this.rows.length + 1}`, createdAt: "2026-10-18T12:00:00.000Z" };
    this.rows.push(row);
    return row;
  }

  async list(rpId: string): Promise<RpRevisionDto[]> {
    return this.rows.filter((row) => row.rpId === rpId).reverse();
  }

  async find(id: string): Promise<RpRevisionDto | null> {
    return this.rows.find((row) => row.id === id) ?? null;
  }
}

export class FakePublicDirectoryStore implements PublicDirectoryStore {
  // Todos os colaboradores; publicRp diz quem aparece no formulário.
  people = [
    { id: "m1", name: "Rogério B", publicRp: true },
    { id: "m2", name: "Bruno", publicRp: true },
    { id: "m3", name: "Carla", publicRp: false },
  ];

  async directory(): Promise<PublicRpDirectoryDto> {
    return { factories: [], lines: [], machines: [], members: (await this.allowed()).map(({ id, name }) => ({ id, name })) };
  }

  async allowedMemberIds(): Promise<string[]> {
    return (await this.allowed()).map((person) => person.id);
  }

  async memberNames(ids: string[]): Promise<Map<string, string>> {
    return new Map(this.people.filter((person) => ids.includes(person.id)).map((person) => [person.id, person.name]));
  }

  async setMemberPublicRp(memberId: string, enabled: boolean): Promise<{ id: string; publicRp: boolean } | null> {
    if (!this.people.some((person) => person.id === memberId)) return null;
    this.people = this.people.map((person) => (person.id === memberId ? { ...person, publicRp: enabled } : person));
    return { id: memberId, publicRp: enabled };
  }

  private async allowed() {
    return this.people.filter((person) => person.publicRp);
  }
}
