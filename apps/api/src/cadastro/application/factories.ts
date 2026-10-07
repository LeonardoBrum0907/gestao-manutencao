import { Injectable } from "@nestjs/common";
import type { FactoryDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredString } from "../../kernel/parse";
import { assertFactoryCanBeRemoved } from "../domain/factory-removal";
import { requireName } from "../domain/names";
import { FactoryRepository } from "../infra/factory.repository";

@Injectable()
export class Factories {
  constructor(private readonly factories: FactoryRepository) {}

  list(): Promise<FactoryDto[]> {
    return this.factories.list();
  }

  async create(body: unknown): Promise<FactoryDto> {
    const name = requireName(requiredString(readObject(body), "name", "Informe o nome da fábrica."), "Informe o nome da fábrica.");
    return this.factories.create(name);
  }

  async rename(id: string, body: unknown): Promise<FactoryDto> {
    const current = await this.factories.find(id);
    if (!current) throw new DomainError("not_found", 404, "Fábrica não encontrada.");
    const name = requireName(requiredString(readObject(body), "name", "Informe o nome da fábrica."), "Informe o nome da fábrica.");
    return this.factories.rename(id, name);
  }

  async remove(id: string): Promise<void> {
    const current = await this.factories.find(id);
    if (!current) throw new DomainError("not_found", 404, "Fábrica não encontrada.");
    const lines = await this.factories.countLines(id);
    assertFactoryCanBeRemoved(lines);
    await this.factories.remove(id);
  }
}
