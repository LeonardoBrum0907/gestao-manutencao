import { Injectable } from "@nestjs/common";
import type { MemberGradeDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredString } from "../../kernel/parse";
import { assertGradeNameAvailable } from "../domain/grade-name";
import { assertGradeCanBeRemoved } from "../domain/grade-removal";
import { requireName } from "../domain/names";
import { GradeRepository } from "../infra/grade.repository";

@Injectable()
export class Grades {
  constructor(private readonly grades: GradeRepository) {}

  list(): Promise<MemberGradeDto[]> {
    return this.grades.list();
  }

  async create(body: unknown): Promise<MemberGradeDto> {
    const name = requireName(requiredString(readObject(body), "name", "Informe o nome do grau."), "Informe o nome do grau.");
    const owner = await this.grades.findByName(name);
    assertGradeNameAvailable(owner?.id ?? null, null);
    return this.grades.create(name);
  }

  async rename(id: string, body: unknown): Promise<MemberGradeDto> {
    const current = await this.grades.find(id);
    if (!current) throw new DomainError("not_found", 404, "Grau não encontrado.");
    const name = requireName(requiredString(readObject(body), "name", "Informe o nome do grau."), "Informe o nome do grau.");
    const owner = await this.grades.findByName(name);
    assertGradeNameAvailable(owner?.id ?? null, id);
    return this.grades.rename(id, name);
  }

  async remove(id: string): Promise<void> {
    const current = await this.grades.find(id);
    if (!current) throw new DomainError("not_found", 404, "Grau não encontrado.");
    assertGradeCanBeRemoved(await this.grades.countMembers(id));
    await this.grades.remove(id);
  }
}
