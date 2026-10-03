import { Inject, Injectable } from "@nestjs/common";
import type { TechnicianMatrixDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { buildMatrix, normalizeEntry, requireEquipments, requireSkill } from "../domain/matrix";
import { MatrixRepository } from "../infra/matrix.repository";
import { parseEntry, parseEquipments } from "./parse-matrix";

@Injectable()
export class TechnicianMatrix {
  constructor(
    private readonly matrix: MatrixRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async show(technicianId: string): Promise<TechnicianMatrixDto> {
    await this.assertTechnician(technicianId);
    const { equipments, entries } = await this.matrix.load(technicianId);
    return { technicianId, entries, ...buildMatrix(equipments, entries) };
  }

  async setEquipments(technicianId: string, body: unknown): Promise<TechnicianMatrixDto> {
    await this.assertTechnician(technicianId);
    await this.matrix.replaceEquipments(technicianId, requireEquipments(parseEquipments(body)));
    return this.show(technicianId);
  }

  async setSkill(technicianId: string, skillId: string, body: unknown): Promise<TechnicianMatrixDto> {
    await this.assertTechnician(technicianId);
    const skill = requireSkill(skillId);
    const entry = normalizeEntry(skill.id, parseEntry(body));
    if (entry) await this.matrix.saveSkill(technicianId, entry);
    else await this.matrix.clearSkill(technicianId, skill.id);
    return this.show(technicianId);
  }

  private async assertTechnician(id: string): Promise<void> {
    if (!(await this.refs.technicianExists(id))) {
      throw new DomainError("not_found", 404, "Técnico não encontrado.");
    }
  }
}
