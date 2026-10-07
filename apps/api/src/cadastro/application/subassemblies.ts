import { Injectable } from "@nestjs/common";
import type { SubassemblyDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredBoolean, requiredString } from "../../kernel/parse";
import { assertSubassemblyNameAvailable } from "../domain/hierarchy";
import { requireName } from "../domain/names";
import { SubassemblyRepository } from "../infra/subassembly.repository";

const NAME_MESSAGE = "Informe o nome do subconjunto.";

@Injectable()
export class Subassemblies {
  constructor(private readonly subassemblies: SubassemblyRepository) {}

  list(): Promise<SubassemblyDto[]> {
    return this.subassemblies.list();
  }

  async create(body: unknown): Promise<SubassemblyDto> {
    const source = readObject(body);
    const equipmentId = requiredString(source, "equipmentId", "Escolha o modelo de equipamento.");
    if (!(await this.subassemblies.equipmentExists(equipmentId))) {
      throw new DomainError("equipment", 400, "Modelo de equipamento não encontrado.");
    }
    const name = requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE);
    assertSubassemblyNameAvailable(name, await this.subassemblies.siblings(equipmentId), null);
    return this.subassemblies.create(equipmentId, name);
  }

  async update(id: string, body: unknown): Promise<SubassemblyDto> {
    const current = await this.subassemblies.find(id);
    if (!current) throw new DomainError("not_found", 404, "Subconjunto não encontrado.");
    const source = readObject(body);
    const name = requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE);
    assertSubassemblyNameAvailable(name, await this.subassemblies.siblings(current.equipmentId), id);
    return this.subassemblies.update(id, { name, archived: requiredBoolean(source, "archived") });
  }

  // As regras da exclusão, sem excluir: a tela pergunta antes de oferecer o botão.
  async checkRemoval(id: string): Promise<void> {
    if (!(await this.subassemblies.find(id))) throw new DomainError("not_found", 404, "Subconjunto não encontrado.");
    if (await this.subassemblies.countPostPreventives(id)) {
      throw new DomainError("subassembly_in_use", 409, "Este subconjunto tem fichas pós-preventiva. Arquive em vez de excluir.");
    }
  }

  async remove(id: string): Promise<void> {
    await this.checkRemoval(id);
    await this.subassemblies.remove(id);
  }
}
