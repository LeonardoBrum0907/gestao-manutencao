import { Injectable } from "@nestjs/common";
import type { EquipmentVersionDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredBoolean, requiredString } from "../../kernel/parse";
import { assertVersionCanBeRemoved, assertVersionNameAvailable } from "../domain/equipment-version";
import { requireName } from "../domain/names";
import { EquipmentVersionRepository } from "../infra/equipment-version.repository";

const NAME_MESSAGE = "Informe o nome da versão.";

// Versões de um modelo de equipamento (M092, NMX). O modelo de uma versão não muda depois de criada.
@Injectable()
export class EquipmentVersions {
  constructor(private readonly versions: EquipmentVersionRepository) {}

  list(): Promise<EquipmentVersionDto[]> {
    return this.versions.list();
  }

  async create(body: unknown): Promise<EquipmentVersionDto> {
    const source = readObject(body);
    const equipmentId = requiredString(source, "equipmentId", "Escolha o modelo de equipamento.");
    if (!(await this.versions.equipmentExists(equipmentId))) {
      throw new DomainError("equipment", 400, `Modelo de equipamento não encontrado (id ${equipmentId}).`);
    }
    const name = requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE);
    assertVersionNameAvailable(name, await this.versions.siblings(equipmentId), null);
    return this.versions.create(equipmentId, name);
  }

  async update(id: string, body: unknown): Promise<EquipmentVersionDto> {
    const current = await this.versions.find(id);
    if (!current) throw new DomainError("not_found", 404, "Versão não encontrada.");
    const source = readObject(body);
    const name = requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE);
    assertVersionNameAvailable(name, await this.versions.siblings(current.equipmentId), id);
    return this.versions.update(id, { name, archived: requiredBoolean(source, "archived") });
  }

  // As regras da exclusão, sem excluir: a tela pergunta antes de oferecer o botão.
  async checkRemoval(id: string): Promise<void> {
    if (!(await this.versions.find(id))) throw new DomainError("not_found", 404, "Versão não encontrada.");
    assertVersionCanBeRemoved(await this.versions.usage(id));
  }

  async remove(id: string): Promise<void> {
    await this.checkRemoval(id);
    await this.versions.remove(id);
  }
}
