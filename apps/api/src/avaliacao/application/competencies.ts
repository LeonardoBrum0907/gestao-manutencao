import { Injectable } from "@nestjs/common";
import type { PerformanceCompetencyDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredBoolean, requiredString } from "../../kernel/parse";
import { requireName } from "../../cadastro/domain/names";
import { requireOrder } from "../../kernel/order";
import { assertCompetencyCanBeRemoved, assertCompetencyNameAvailable } from "../domain/competency-catalog";
import { CompetencyRepository } from "../infra/competency.repository";

const NAME_MESSAGE = "Informe o nome da competência.";

@Injectable()
export class Competencies {
  constructor(private readonly competencies: CompetencyRepository) {}

  list(): Promise<PerformanceCompetencyDto[]> {
    return this.competencies.list();
  }

  async create(body: unknown): Promise<PerformanceCompetencyDto> {
    const name = requireName(requiredString(readObject(body), "name", NAME_MESSAGE), NAME_MESSAGE);
    assertCompetencyNameAvailable((await this.competencies.findByName(name))?.id ?? null, null);
    return this.competencies.create(name);
  }

  async update(id: string, body: unknown): Promise<PerformanceCompetencyDto> {
    await this.require(id);
    const source = readObject(body);
    const name = requireName(requiredString(source, "name", NAME_MESSAGE), NAME_MESSAGE);
    assertCompetencyNameAvailable((await this.competencies.findByName(name))?.id ?? null, id);
    return this.competencies.update(id, { name, archived: requiredBoolean(source, "archived") });
  }

  async reorder(body: unknown): Promise<PerformanceCompetencyDto[]> {
    const existing = (await this.competencies.list()).map((competency) => competency.id);
    await this.competencies.reorder(requireOrder(readObject(body).ids, existing));
    return this.competencies.list();
  }

  async remove(id: string): Promise<void> {
    await this.require(id);
    assertCompetencyCanBeRemoved(await this.competencies.countScores(id));
    await this.competencies.remove(id);
  }

  private async require(id: string) {
    const competency = await this.competencies.find(id);
    if (!competency) throw new DomainError("not_found", 404, "Competência não encontrada.");
    return competency;
  }
}
