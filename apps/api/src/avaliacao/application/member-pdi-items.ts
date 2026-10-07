import { Inject, Injectable } from "@nestjs/common";
import type { PdiItemDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { completedAtFor, readPdiItem, type PdiItemFields } from "../domain/pdi-item";
import { PdiItemRepository } from "../infra/pdi-item.repository";

@Injectable()
export class MemberPdiItems {
  constructor(
    private readonly items: PdiItemRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async list(memberId: string): Promise<PdiItemDto[]> {
    await this.assertMember(memberId);
    return this.items.list(memberId);
  }

  async create(memberId: string, body: unknown): Promise<PdiItemDto> {
    await this.assertMember(memberId);
    const fields = readPdiItem(readObject(body), false);
    await this.assertReferences(fields);
    const created = await this.items.create(memberId, { ...fields, title: fields.title as string });
    // Nasce já concluído só se o status veio assim; a data de conclusão acompanha.
    if (fields.status === "done") return this.items.update(created.id, {}, completedAtFor("done", null, new Date()));
    return created;
  }

  async update(memberId: string, itemId: string, body: unknown): Promise<PdiItemDto> {
    const current = await this.items.find(memberId, itemId);
    if (!current) throw new DomainError("not_found", 404, "Item do PDI não encontrado.");
    const fields = readPdiItem(readObject(body), true);
    await this.assertReferences(fields);
    const completedAt = fields.status ? completedAtFor(fields.status, current.completedAt, new Date()) : undefined;
    return this.items.update(itemId, fields, completedAt);
  }

  async remove(memberId: string, itemId: string): Promise<void> {
    const current = await this.items.find(memberId, itemId);
    if (!current) throw new DomainError("not_found", 404, "Item do PDI não encontrado.");
    await this.items.remove(itemId);
  }

  private async assertReferences(fields: Partial<PdiItemFields>): Promise<void> {
    if (fields.lineId && !(await this.refs.lineExists(fields.lineId))) {
      throw new DomainError("line", 400, "Linha não encontrada.");
    }
    if (fields.responsibleId && !(await this.refs.memberExists(fields.responsibleId))) {
      throw new DomainError("responsible", 400, "Responsável não encontrado.");
    }
    if (fields.skillId && !(await this.items.skillExists(fields.skillId))) {
      throw new DomainError("skill", 400, "Habilidade não encontrada.");
    }
  }

  private async assertMember(id: string): Promise<void> {
    if (!(await this.refs.memberExists(id))) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
  }
}

