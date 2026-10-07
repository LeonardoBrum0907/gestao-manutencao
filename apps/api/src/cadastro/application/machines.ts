import { Injectable } from "@nestjs/common";
import type { MachineDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject, requiredString } from "../../kernel/parse";
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

  async remove(id: string): Promise<void> {
    if (!(await this.machines.find(id))) throw new DomainError("not_found", 404, "Máquina não encontrada.");
    if (await this.machines.countPostPreventives(id)) {
      throw new DomainError("machine_in_use", 409, "Esta máquina tem fichas pós-preventiva. Exclua as fichas antes.");
    }
    await this.machines.remove(id);
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
    // Os subconjuntos das fichas vêm do modelo: trocar o modelo deixaria fichas apontando para outro equipamento.
    if (id && current && current.equipmentId !== equipmentId && (await this.machines.countPostPreventives(id))) {
      throw new DomainError("machine_model_locked", 409, "Esta máquina tem fichas pós-preventiva; o modelo de equipamento não pode mudar.");
    }
    const input = {
      lineId,
      equipmentId,
      name: requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE),
      tag: optionalString(source, "tag"),
      manufacturer: optionalString(source, "manufacturer"),
      status: requireMachineStatus(requiredString(source, "status", "Escolha o status.")),
      notes: optionalString(source, "notes"),
    };
    return id ? this.machines.update(id, input) : this.machines.create(input);
  }
}
