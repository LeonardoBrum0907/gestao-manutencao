import { Inject, Injectable } from "@nestjs/common";
import type { MemberMatrixDto, MemberPosition } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { assertMatrixEditable, buildMatrix, normalizeEntry, requireEquipments, requireSkill } from "../domain/matrix";
import { CatalogRepository } from "../infra/catalog.repository";
import { MatrixRepository } from "../infra/matrix.repository";
import { parseEntry, parseEquipments } from "./parse-matrix";

@Injectable()
export class MemberMatrix {
  constructor(
    private readonly matrix: MatrixRepository,
    private readonly catalog: CatalogRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async show(memberId: string): Promise<MemberMatrixDto> {
    await this.assertMember(memberId);
    const [{ equipments, entries }, catalog] = await Promise.all([this.matrix.load(memberId), this.catalog.load()]);
    return { memberId, entries, ...buildMatrix(catalog, equipments, entries) };
  }

  async setEquipments(memberId: string, body: unknown): Promise<MemberMatrixDto> {
    assertMatrixEditable(await this.assertMember(memberId));
    const [{ equipments: current }, catalog] = await Promise.all([this.matrix.load(memberId), this.catalog.load()]);
    await this.matrix.replaceEquipments(memberId, requireEquipments(parseEquipments(body), catalog, current));
    return this.show(memberId);
  }

  async setSkill(memberId: string, skillId: string, body: unknown): Promise<MemberMatrixDto> {
    assertMatrixEditable(await this.assertMember(memberId));
    const skill = requireSkill(skillId, await this.catalog.load());
    const entry = normalizeEntry(skill.id, parseEntry(body));
    if (entry) await this.matrix.saveSkill(memberId, entry);
    else await this.matrix.clearSkill(memberId, skill.id);
    return this.show(memberId);
  }

  private async assertMember(id: string): Promise<MemberPosition> {
    const position = await this.refs.memberPosition(id);
    if (!position) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    return position;
  }
}
