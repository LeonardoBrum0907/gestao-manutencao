import { Injectable } from "@nestjs/common";
import type { TechnicianDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject, requiredString } from "../../kernel/parse";
import { requireName, requireShift, requireTechnicianStatus } from "../domain/names";
import { GradeRepository } from "../infra/grade.repository";
import { RoleRepository } from "../infra/role.repository";
import { TechnicianRepository } from "../infra/technician.repository";

@Injectable()
export class Technicians {
  constructor(
    private readonly technicians: TechnicianRepository,
    private readonly roles: RoleRepository,
    private readonly grades: GradeRepository,
  ) {}

  list(): Promise<TechnicianDto[]> {
    return this.technicians.list();
  }

  create(body: unknown): Promise<TechnicianDto> {
    return this.write(body, null);
  }

  update(id: string, body: unknown): Promise<TechnicianDto> {
    return this.write(body, id);
  }

  async remove(id: string): Promise<void> {
    const current = await this.technicians.find(id);
    if (!current) throw new DomainError("not_found", 404, "Técnico não encontrado.");
    await this.technicians.remove(id);
  }

  private async write(body: unknown, id: string | null): Promise<TechnicianDto> {
    if (id) {
      const current = await this.technicians.find(id);
      if (!current) throw new DomainError("not_found", 404, "Técnico não encontrado.");
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
      name: requireName(requiredString(source, "name", "Informe o nome do técnico."), "Informe o nome do técnico."),
      roleId,
      gradeId,
      shift: requireShift(requiredString(source, "shift", "Escolha o turno.")),
      area: optionalString(source, "area"),
      status: requireTechnicianStatus(requiredString(source, "status", "Escolha o status.")),
      registration: optionalString(source, "registration"),
      contact: optionalString(source, "contact"),
      notes: optionalString(source, "notes"),
    };
    return id ? this.technicians.update(id, input) : this.technicians.create(input);
  }
}
