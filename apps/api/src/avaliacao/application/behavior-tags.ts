import { Injectable } from "@nestjs/common";
import { isBehaviorTagGroup, type BehaviorTagDto, type BehaviorTagGroup } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredBoolean, requiredString } from "../../kernel/parse";
import { requireName } from "../../cadastro/domain/names";
import { requireOrder } from "../../kernel/order";
import {
  assertBehaviorTagCanBeRemoved,
  assertBehaviorTagNameAvailable,
  tagsOfGroup,
} from "../domain/behavior-tag-catalog";
import { BehaviorTagRepository } from "../infra/behavior-tag.repository";

const NAME_MESSAGE = "Informe o nome da opção.";

function requireGroup(source: Record<string, unknown>): BehaviorTagGroup {
  const group = source.group;
  if (typeof group !== "string" || !isBehaviorTagGroup(group)) throw new DomainError("invalid", 400, "Categoria inválida.");
  return group;
}

@Injectable()
export class BehaviorTags {
  constructor(private readonly tags: BehaviorTagRepository) {}

  list(): Promise<BehaviorTagDto[]> {
    return this.tags.list();
  }

  async create(body: unknown): Promise<BehaviorTagDto> {
    const source = readObject(body);
    const group = requireGroup(source);
    const name = requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE);
    assertBehaviorTagNameAvailable((await this.tags.findByName(group, name))?.id ?? null, null);
    return this.tags.create(group, name);
  }

  async update(id: string, body: unknown): Promise<BehaviorTagDto> {
    const current = await this.require(id);
    const source = readObject(body);
    const name = requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE);
    if (!isBehaviorTagGroup(current.group)) throw new DomainError("invalid", 400, "Categoria inválida.");
    assertBehaviorTagNameAvailable((await this.tags.findByName(current.group, name))?.id ?? null, id);
    return this.tags.update(id, { name, archived: requiredBoolean(source, "archived") });
  }

  // A ordem é por categoria: a tela manda só os ids da categoria que mudou.
  async reorder(body: unknown): Promise<BehaviorTagDto[]> {
    const source = readObject(body);
    const group = requireGroup(source);
    await this.tags.reorder(requireOrder(source.ids, tagsOfGroup(await this.tags.list(), group)));
    return this.tags.list();
  }

  // As regras da exclusão, sem excluir: a tela pergunta antes de oferecer o botão.
  async checkRemoval(id: string): Promise<void> {
    await this.require(id);
    assertBehaviorTagCanBeRemoved(await this.tags.countMembers(id));
  }

  async remove(id: string): Promise<void> {
    await this.checkRemoval(id);
    await this.tags.remove(id);
  }

  private async require(id: string) {
    const tag = await this.tags.find(id);
    if (!tag) throw new DomainError("not_found", 404, "Opção não encontrada.");
    return tag;
  }
}
