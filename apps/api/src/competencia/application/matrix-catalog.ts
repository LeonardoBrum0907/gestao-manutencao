import { Injectable } from "@nestjs/common";
import type { MatrixCatalogDto, MatrixEquipmentDto, MatrixSkillDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { requireOrder } from "../../kernel/order";
import { readObject, requiredBoolean, requiredString } from "../../kernel/parse";
import {
  assertEquipmentCanBeRemoved,
  assertEquipmentNameAvailable,
  assertSkillCanBeRemoved,
  requireLevel,
  requireMinQualified,
  requireText,
} from "../domain/catalog";
import { CatalogRepository, type SkillWrite } from "../infra/catalog.repository";

const EQUIPMENT_MESSAGE = "Informe o nome do equipamento.";

@Injectable()
export class MatrixCatalog {
  constructor(private readonly catalog: CatalogRepository) {}

  show(): Promise<MatrixCatalogDto> {
    return this.catalog.load();
  }

  async createEquipment(body: unknown): Promise<MatrixEquipmentDto> {
    const name = requireText(requiredString(readObject(body), "name", EQUIPMENT_MESSAGE), EQUIPMENT_MESSAGE);
    assertEquipmentNameAvailable((await this.catalog.findEquipmentByName(name))?.id ?? null, null);
    return this.catalog.createEquipment(name);
  }

  async updateEquipment(id: string, body: unknown): Promise<MatrixEquipmentDto> {
    await this.requireEquipment(id);
    const source = readObject(body);
    const name = requireText(requiredString(source, "name", EQUIPMENT_MESSAGE), EQUIPMENT_MESSAGE);
    assertEquipmentNameAvailable((await this.catalog.findEquipmentByName(name))?.id ?? null, id);
    return this.catalog.updateEquipment(id, {
      name,
      archived: requiredBoolean(source, "archived"),
      ...("minQualified" in source ? { minQualified: requireMinQualified(source.minQualified) } : {}),
    });
  }

  async checkEquipmentRemoval(id: string): Promise<void> {
    await this.requireEquipment(id);
    assertEquipmentCanBeRemoved(await this.catalog.equipmentUsage(id));
  }

  async removeEquipment(id: string): Promise<void> {
    await this.checkEquipmentRemoval(id);
    await this.catalog.removeEquipment(id);
  }

  async reorderEquipments(body: unknown): Promise<MatrixCatalogDto> {
    const existing = (await this.catalog.load()).equipments.map((equipment) => equipment.id);
    await this.catalog.reorderEquipments(requireOrder(readObject(body).ids, existing));
    return this.catalog.load();
  }

  async createSkill(body: unknown): Promise<MatrixSkillDto> {
    return this.catalog.createSkill(await this.parseSkill(body));
  }

  async updateSkill(id: string, body: unknown): Promise<MatrixSkillDto> {
    const current = await this.catalog.findSkill(id);
    if (!current) throw new DomainError("not_found", 404, "Habilidade não encontrada.");
    const input = await this.parseSkill(body);
    const archived = requiredBoolean(readObject(body), "archived");
    return this.catalog.updateSkill(id, { ...input, archived }, input.equipmentId !== current.equipmentId);
  }

  async removeSkill(id: string): Promise<void> {
    if (!(await this.catalog.findSkill(id))) throw new DomainError("not_found", 404, "Habilidade não encontrada.");
    assertSkillCanBeRemoved(await this.catalog.countSkillScores(id));
    await this.catalog.removeSkill(id);
  }

  async reorderSkills(equipmentId: string, body: unknown): Promise<MatrixCatalogDto> {
    await this.requireEquipment(equipmentId);
    await this.catalog.reorderSkills(requireOrder(readObject(body).ids, await this.catalog.skillIdsOf(equipmentId)));
    return this.catalog.load();
  }

  private async parseSkill(body: unknown): Promise<SkillWrite> {
    const source = readObject(body);
    const equipmentId = requiredString(source, "equipmentId", "Escolha o equipamento.");
    await this.requireEquipment(equipmentId, 400);
    return {
      equipmentId,
      subgroup: requireText(requiredString(source, "subgroup", "Informe o subconjunto."), "Informe o subconjunto."),
      text: requireText(requiredString(source, "text", "Escreva a habilidade."), "Escreva a habilidade."),
      level: requireLevel(requiredString(source, "level", "Escolha o nível.")),
    };
  }

  private async requireEquipment(id: string, status: 400 | 404 = 404) {
    const equipment = await this.catalog.findEquipment(id);
    if (!equipment) throw new DomainError(status === 404 ? "not_found" : "equipment", status, "Equipamento não encontrado.");
    return equipment;
  }
}
