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
    await this.machines.remove(id);
  }

  private async write(body: unknown, id: string | null): Promise<MachineDto> {
    if (id && !(await this.machines.find(id))) throw new DomainError("not_found", 404, "Máquina não encontrada.");
    const source = readObject(body);
    const lineId = requiredString(source, "lineId", "Escolha a linha.");
    if (!(await this.lines.find(lineId))) throw new DomainError("line", 400, "Linha não encontrada.");
    const equipmentId = optionalString(source, "equipmentId");
    if (equipmentId && !(await this.subassemblies.equipmentExists(equipmentId))) {
      throw new DomainError("equipment", 400, "Modelo de equipamento não encontrado.");
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
