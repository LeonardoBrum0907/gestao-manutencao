import { Injectable } from "@nestjs/common";
import type { LineDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject, requiredBoolean, requiredString } from "../../kernel/parse";
import { assertLineCanBeRemoved } from "../domain/hierarchy";
import { requireMachineStatus, requireName } from "../domain/names";
import { FactoryRepository } from "../infra/factory.repository";
import { LineRepository } from "../infra/line.repository";
import { MachineRepository } from "../infra/machine.repository";

@Injectable()
export class Lines {
  constructor(
    private readonly lines: LineRepository,
    private readonly factories: FactoryRepository,
    private readonly machines: MachineRepository,
  ) {}

  list(): Promise<LineDto[]> {
    return this.lines.list();
  }

  create(body: unknown): Promise<LineDto> {
    return this.write(body, null);
  }

  update(id: string, body: unknown): Promise<LineDto> {
    return this.write(body, id);
  }

  async remove(id: string): Promise<void> {
    const current = await this.lines.find(id);
    if (!current) throw new DomainError("not_found", 404, "Linha não encontrada.");
    assertLineCanBeRemoved(await this.machines.countByLine(id));
    await this.lines.remove(id);
  }

  private async write(body: unknown, id: string | null): Promise<LineDto> {
    if (id) {
      const current = await this.lines.find(id);
      if (!current) throw new DomainError("not_found", 404, "Linha não encontrada.");
    }
    const source = readObject(body);
    const name = requireName(requiredString(source, "name", "Informe o nome da linha."), "Informe o nome da linha.");
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
    return id ? this.lines.update(id, input) : this.lines.create(input);
  }
}
