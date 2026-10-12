import { Injectable } from "@nestjs/common";
import type { MachineDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject, requiredString } from "../../kernel/parse";
import { assertHideable, assertModelChangeAllowed, machineVersion } from "../domain/machine-model";
import { requireMachineStatus, requireName } from "../domain/names";
import { LineRepository } from "../infra/line.repository";
import { MachineRepository } from "../infra/machine.repository";
import { SubassemblyRepository } from "../infra/subassembly.repository";

const NAME_MESSAGE = "Informe o nome da máquina.";

@Injectable()
export class Machines {
  constructor(
    private readonly machines: MachineRepository,
    private readonly lines: LineRepository,
    private readonly subassemblies: SubassemblyRepository,
  ) {}

  list(): Promise<MachineDto[]> {
    return this.machines.list();
  }

  create(body: unknown): Promise<MachineDto> {
    return this.write(body, null);
  }

  update(id: string, body: unknown): Promise<MachineDto> {
    return this.write(body, id);
  }

  // As regras da exclusão, sem excluir: a tela pergunta antes de oferecer o botão.
  async checkRemoval(id: string): Promise<void> {
    if (!(await this.machines.find(id))) throw new DomainError("not_found", 404, "Máquina não encontrada.");
    if (await this.machines.countPostPreventives(id)) {
      throw new DomainError("machine_in_use", 409, "Esta máquina tem fichas pós-preventiva. Exclua as fichas antes.");
    }
    if (await this.machines.countTechCards(id)) {
      throw new DomainError("machine_in_use", 409, "Esta máquina tem fichas de documentação técnica. Exclua ou mude as fichas antes.");
    }
  }

  async remove(id: string): Promise<void> {
    await this.checkRemoval(id);
    await this.machines.remove(id);
  }

  /**
   * Subconjuntos do modelo (ou da versão) que esta máquina não tem. Recebe a lista inteira: { ids: string[] }.
   * Ex.: PUT /api/machines/m1/hidden-subassemblies { "ids": ["s3"] }
   */
  async setHidden(id: string, body: unknown): Promise<MachineDto> {
    const machine = await this.machines.findDto(id);
    if (!machine) throw new DomainError("not_found", 404, "Máquina não encontrada.");
    const ids = readIds(readObject(body).ids);
    assertHideable(machine, ids, await this.machines.subassemblyScopes(ids));
    return this.machines.setHidden(id, ids);
  }

  private async write(body: unknown, id: string | null): Promise<MachineDto> {
    const current = id ? await this.machines.find(id) : null;
    if (id && !current) throw new DomainError("not_found", 404, "Máquina não encontrada.");
    const source = readObject(body);
    const lineId = requiredString(source, "lineId", "Escolha a linha.");
    if (!(await this.lines.find(lineId))) throw new DomainError("line", 400, "Linha não encontrada.");
    const equipmentId = optionalString(source, "equipmentId");
    if (equipmentId && !(await this.subassemblies.equipmentExists(equipmentId))) {
      throw new DomainError("equipment", 400, "Modelo de equipamento não encontrado.");
    }
    const modelChanged = Boolean(current && current.equipmentId !== equipmentId);
    if (id && current && modelChanged) await this.assertModelCanChange(id, current.equipmentId, equipmentId);
    const input = {
      lineId,
      equipmentId,
      versionId: await this.versionOf(equipmentId, optionalString(source, "versionId"), current?.versionId ?? null),
      name: requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE),
      tag: optionalString(source, "tag"),
      manufacturer: optionalString(source, "manufacturer"),
      status: requireMachineStatus(requiredString(source, "status", "Escolha o status.")),
      notes: optionalString(source, "notes"),
    };
    return id ? this.machines.update(id, input, modelChanged) : this.machines.create(input);
  }

  // Os subconjuntos das fichas e os próprios da máquina vêm do modelo: trocar o modelo os deixaria apontando para outro equipamento.
  private async assertModelCanChange(id: string, currentEquipmentId: string | null, nextEquipmentId: string | null): Promise<void> {
    if (await this.machines.countPostPreventives(id)) {
      throw new DomainError("machine_model_locked", 409, "Esta máquina tem fichas pós-preventiva; o modelo de equipamento não pode mudar.");
    }
    assertModelChangeAllowed(currentEquipmentId, nextEquipmentId, await this.machines.countOwnSubassemblies(id));
  }

  private async versionOf(equipmentId: string | null, versionId: string | null, currentVersionId: string | null): Promise<string | null> {
    const version = versionId ? await this.machines.findVersion(versionId) : null;
    return machineVersion(equipmentId, versionId, version, currentVersionId);
  }
}

function readIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new DomainError("invalid", 400, `Esperava ids como lista de textos (recebido ${JSON.stringify(value)}).`);
  }
  return [...new Set(value as string[])];
}
