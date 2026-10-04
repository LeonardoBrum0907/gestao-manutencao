import { Injectable } from "@nestjs/common";
import type { MemberDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject, requiredString } from "../../kernel/parse";
import { assertMemberCanBeRemoved } from "../domain/member-removal";
import { requireName, requireShift, requireMemberStatus } from "../domain/names";
import { GradeRepository } from "../infra/grade.repository";
import { RoleRepository } from "../infra/role.repository";
import { MemberRepository } from "../infra/member.repository";

@Injectable()
export class Members {
  constructor(
    private readonly members: MemberRepository,
    private readonly roles: RoleRepository,
    private readonly grades: GradeRepository,
  ) {}

  list(): Promise<MemberDto[]> {
    return this.members.list();
  }

  create(body: unknown): Promise<MemberDto> {
    return this.write(body, null);
  }

  update(id: string, body: unknown): Promise<MemberDto> {
    return this.write(body, id);
  }

  async remove(id: string): Promise<void> {
    const current = await this.members.find(id);
    if (!current) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    assertMemberCanBeRemoved(await this.members.countRecords(id));
    await this.members.remove(id);
  }

  private async write(body: unknown, id: string | null): Promise<MemberDto> {
    if (id) {
      const current = await this.members.find(id);
      if (!current) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    }
    const source = readObject(body);
    const roleId = requiredString(source, "roleId", "Escolha a função.");
    const role = await this.roles.find(roleId);
    if (!role) throw new DomainError("role", 400, "Função não encontrada.");
    const gradeId = optionalString(source, "gradeId");
    if (gradeId && !(await this.grades.find(gradeId))) {
      throw new DomainError("grade", 400, "Grau não encontrado.");
    }
    const input = {
      name: requireName(requiredString(source, "name", "Informe o nome do colaborador."), "Informe o nome do colaborador."),
      roleId,
      gradeId,
      shift: requireShift(requiredString(source, "shift", "Escolha o turno.")),
      area: optionalString(source, "area"),
      status: requireMemberStatus(requiredString(source, "status", "Escolha o status.")),
      registration: optionalString(source, "registration"),
      contact: optionalString(source, "contact"),
      notes: optionalString(source, "notes"),
    };
    return id ? this.members.update(id, input) : this.members.create(input);
  }
}
