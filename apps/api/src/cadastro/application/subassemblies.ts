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

  async remove(id: string): Promise<void> {
    if (!(await this.subassemblies.find(id))) throw new DomainError("not_found", 404, "Subconjunto não encontrado.");
    await this.subassemblies.remove(id);
  }
}
