import { Injectable } from "@nestjs/common";
import { isTechCardType, type TechCardFields, type TechCardHit, type TechCardSearchDto, type TechCardSummaryDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";
import { readTechCardFields } from "../domain/tech-card";
import { TechCardRepository, type TechCardFilter } from "../infra/tech-card.repository";

export type TechCardQuery = Record<string, string | string[] | undefined>;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function single(value: string | string[] | undefined): string | null {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || null;
}

function readLimit(value: string | null): number {
  if (!value) return DEFAULT_LIMIT;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1) throw new DomainError("invalid", 400, `Limite inválido (${value}): use um inteiro a partir de 1.`);
  return Math.min(limit, MAX_LIMIT);
}

/**
 * Filtros da busca vindos da URL (?q=&type=&machineId=&lineId=&equipmentId=&subassemblyId=&documentId=&review=&limit=).
 * @example parseTechCardFilter({ q: "127", machineId: "m1" })
 */
export function parseTechCardFilter(query: TechCardQuery): TechCardFilter {
  const type = single(query.type);
  if (type && !isTechCardType(type)) throw new DomainError("invalid", 400, `Tipo de ficha "${type}" não existe.`);
  const review = single(query.review);
  return {
    query: single(query.q) ?? "",
    type: type && isTechCardType(type) ? type : null,
    machineId: single(query.machineId),
    lineId: single(query.lineId),
    equipmentId: single(query.equipmentId),
    subassemblyId: single(query.subassemblyId),
    documentId: single(query.documentId),
    reviewNeeded: review === null ? null : review === "true",
    limit: readLimit(single(query.limit)),
  };
}

@Injectable()
export class TechCards {
  constructor(private readonly cards: TechCardRepository) {}

  async search(query: TechCardQuery): Promise<TechCardSearchDto> {
    const filter = parseTechCardFilter(query);
    const [{ hits, total }, postPreventiveIds] = await Promise.all([
      this.cards.search(filter),
      filter.type ? Promise.resolve([]) : this.cards.matchingPostPreventiveIds(filter.query, filter.machineId, filter.lineId),
    ]);
    return { hits, postPreventiveIds, total };
  }

  async summary(machineId: string | null): Promise<TechCardSummaryDto> {
    if (!machineId) throw new DomainError("invalid", 400, "Informe a máquina (machineId).");
    const counts = await this.cards.countByType(machineId);
    return { machineId, counts, total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
  }

  async get(id: string): Promise<TechCardHit> {
    const found = await this.cards.find(id);
    if (!found) throw new DomainError("not_found", 404, "Ficha não encontrada.");
    return found;
  }

  async create(body: unknown): Promise<TechCardHit> {
    const fields = readTechCardFields(readObject(body));
    await this.assertRefs(fields);
    return this.cards.create(fields);
  }

  async update(id: string, body: unknown): Promise<TechCardHit> {
    await this.get(id);
    const fields = readTechCardFields(readObject(body));
    await this.assertRefs(fields);
    return this.cards.update(id, fields);
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.cards.remove(id);
  }

  // O alvo existe; o subconjunto e o documento são do mesmo modelo do alvo.
  private async assertRefs(fields: TechCardFields): Promise<void> {
    const equipmentId = await this.resolveModel(fields);
    await Promise.all([this.assertSubassembly(fields.subassemblyId, equipmentId), this.assertDocument(fields.documentId, equipmentId)]);
  }

  // Modelo do alvo da ficha: o próprio, o da máquina, ou nenhum (linha).
  private async resolveModel(fields: TechCardFields): Promise<string | null> {
    if (fields.machineId) {
      const machine = await this.cards.findMachine(fields.machineId);
      if (!machine) throw new DomainError("machine", 400, `Máquina não encontrada (id ${fields.machineId}).`);
      return machine.equipmentId;
    }
    if (fields.lineId) {
      if (!(await this.cards.lineExists(fields.lineId))) throw new DomainError("line", 400, `Linha não encontrada (id ${fields.lineId}).`);
      return null;
    }
    if (fields.equipmentId && !(await this.cards.equipmentExists(fields.equipmentId))) {
      throw new DomainError("equipment", 400, `Modelo de equipamento não encontrado (id ${fields.equipmentId}).`);
    }
    return fields.equipmentId;
  }

  private async assertSubassembly(subassemblyId: string | null, equipmentId: string | null): Promise<void> {
    if (!subassemblyId) return;
    const subassembly = await this.cards.findSubassembly(subassemblyId);
    if (!subassembly) throw new DomainError("subassembly", 400, `Subconjunto não encontrado (id ${subassemblyId}).`);
    if (!equipmentId) throw new DomainError("subassembly", 400, "Subconjunto só em ficha de modelo ou de máquina com modelo.");
    if (subassembly.equipmentId !== equipmentId) throw new DomainError("subassembly", 400, "Este subconjunto não é do modelo da ficha.");
  }

  private async assertDocument(documentId: string | null, equipmentId: string | null): Promise<void> {
    if (!documentId) return;
    const document = await this.cards.findDocumentModel(documentId);
    if (!document) throw new DomainError("document", 400, `Documento não encontrado (id ${documentId}).`);
    if (equipmentId && document.equipmentId !== equipmentId) {
      throw new DomainError("document", 400, "Este documento é de outro modelo de equipamento.");
    }
  }
}
