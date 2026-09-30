import { Injectable } from "@nestjs/common";
import type { MachineDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject, requiredBoolean, requiredString } from "../../kernel/parse";
import { requireMachineStatus, requireName } from "../domain/names";
import { FactoryRepository } from "../infra/factory.repository";
import { MachineRepository } from "../infra/machine.repository";

@Injectable()
export class Machines {
  constructor(
    private readonly machines: MachineRepository,
    private readonly factories: FactoryRepository,
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
    const current = await this.machines.find(id);
    if (!current) throw new DomainError("not_found", 404, "Máquina não encontrada.");
    await this.machines.remove(id);
  }

  private async write(body: unknown, id: string | null): Promise<MachineDto> {
    if (id) {
      const current = await this.machines.find(id);
      if (!current) throw new DomainError("not_found", 404, "Máquina não encontrada.");
    }
    const source = readObject(body);
    const name = requireName(requiredString(source, "name", "Informe o nome da máquina."), "Informe o nome da máquina.");
    const factoryId = requiredString(source, "factoryId", "Escolha a fábrica.");
    const factory = await this.factories.find(factoryId);
    if (!factory) throw new DomainError("factory", 400, "Fábrica não encontrada.");
    const input = {
      name,
      factoryId,
      sector: optionalString(source, "sector"),
      manufacturer: optionalString(source, "manufacturer"),
      internalCode: optionalString(source, "internalCode"),
      status: requireMachineStatus(requiredString(source, "status", "Escolha o status.")),
      notes: optionalString(source, "notes"),
      isDailyLine: requiredBoolean(source, "isDailyLine"),
      isCritical: requiredBoolean(source, "isCritical"),
    };
    return id ? this.machines.update(id, input) : this.machines.create(input);
  }
}
