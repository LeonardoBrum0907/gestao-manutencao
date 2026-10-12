import { Injectable } from "@nestjs/common";
import type { SubassemblyDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject, requiredBoolean, requiredString } from "../../kernel/parse";
import { assertSubassemblyNameAvailable, type SubassemblyPlace } from "../domain/hierarchy";
import { subassemblyPlace } from "../domain/subassembly-place";
import { requireName } from "../domain/names";
import { SubassemblyRepository } from "../infra/subassembly.repository";

const NAME_MESSAGE = "Informe o nome do subconjunto.";

@Injectable()
export class Subassemblies {
  constructor(private readonly subassemblies: SubassemblyRepository) {}

  list(): Promise<SubassemblyDto[]> {
    return this.subassemblies.list();
  }

  // versionId ou machineId opcionais: sem eles o subconjunto vale para todas as máquinas do modelo.
  async create(body: unknown): Promise<SubassemblyDto> {
    const source = readObject(body);
    const equipmentId = requiredString(source, "equipmentId", "Escolha o modelo de equipamento.");
    if (!(await this.subassemblies.equipmentExists(equipmentId))) {
      throw new DomainError("equipment", 400, "Modelo de equipamento não encontrado.");
    }
    const place = await this.placeOf(equipmentId, { versionId: optionalString(source, "versionId"), machineId: optionalString(source, "machineId") });
    const name = requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE);
    await this.assertNameFree(equipmentId, name, place, null);
    return this.subassemblies.create(equipmentId, place, name);
  }

  // Onde o subconjunto vale não muda depois de criado; só o nome e o arquivado.
  async update(id: string, body: unknown): Promise<SubassemblyDto> {
    const current = await this.subassemblies.find(id);
    if (!current) throw new DomainError("not_found", 404, "Subconjunto não encontrado.");
    const source = readObject(body);
    const name = requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE);
    await this.assertNameFree(current.equipmentId, name, current, id);
    return this.subassemblies.update(id, { name, archived: requiredBoolean(source, "archived") });
  }

  private async placeOf(equipmentId: string, wanted: SubassemblyPlace): Promise<SubassemblyPlace> {
    const [version, machine] = await Promise.all([
      wanted.versionId ? this.subassemblies.findVersion(wanted.versionId) : null,
      wanted.machineId ? this.subassemblies.findMachine(wanted.machineId) : null,
    ]);
    return subassemblyPlace(equipmentId, wanted, { version, machine });
  }

  private async assertNameFree(equipmentId: string, name: string, place: SubassemblyPlace, currentId: string | null): Promise<void> {
    const [siblings, versions] = await Promise.all([this.subassemblies.siblings(equipmentId), this.subassemblies.machineVersions(equipmentId)]);
    assertSubassemblyNameAvailable(name, place, siblings, currentId, (machineId) => versions.get(machineId) ?? null);
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
