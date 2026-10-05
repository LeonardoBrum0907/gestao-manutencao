import { Inject, Injectable } from "@nestjs/common";
import type { MemberMatrixDto, MemberPosition } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { assertMatrixEditable, buildMatrix, normalizeEntry, requireEquipments, requireSkill, type MatrixEntry } from "../domain/matrix";
import { CatalogRepository } from "../infra/catalog.repository";
import { MatrixRepository } from "../infra/matrix.repository";
import { parseBulk, parseEntry, parseEquipments } from "./parse-matrix";

@Injectable()
export class MemberMatrix {
  constructor(
    private readonly matrix: MatrixRepository,
    private readonly catalog: CatalogRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async show(memberId: string): Promise<MemberMatrixDto> {
    await this.assertMember(memberId);
    return this.build(memberId);
  }

  // Quem já checou o colaborador não precisa checar de novo para devolver a matriz.
  private async build(memberId: string): Promise<MemberMatrixDto> {
    const [{ equipments, entries }, catalog] = await Promise.all([this.matrix.load(memberId), this.catalog.load()]);
    return { memberId, entries, ...buildMatrix(catalog, equipments, entries) };
  }

  async setEquipments(memberId: string, body: unknown): Promise<MemberMatrixDto> {
    assertMatrixEditable(await this.assertMember(memberId));
    const [{ equipments: current }, catalog] = await Promise.all([this.matrix.load(memberId), this.catalog.load()]);
    await this.matrix.replaceEquipments(memberId, requireEquipments(parseEquipments(body), catalog, current));
    return this.build(memberId);
  }

  async setSkill(memberId: string, skillId: string, body: unknown): Promise<MemberMatrixDto> {
    const [position, catalog] = await Promise.all([this.assertMember(memberId), this.catalog.load()]);
    assertMatrixEditable(position);
    const skill = requireSkill(skillId, catalog);
    const entry = normalizeEntry(skill.id, parseEntry(body));
    if (entry) await this.matrix.saveSkill(memberId, entry);
    else await this.matrix.clearSkill(memberId, skill.id);
    return this.build(memberId);
  }

  async setSkills(memberId: string, body: unknown): Promise<MemberMatrixDto> {
    const [position, catalog] = await Promise.all([this.assertMember(memberId), this.catalog.load()]);
    assertMatrixEditable(position);
    const save: MatrixEntry[] = [];
    const clear: string[] = [];
    for (const { skillId, input } of parseBulk(body)) {
      const entry = normalizeEntry(requireSkill(skillId, catalog).id, input);
      if (entry) save.push(entry);
      else clear.push(skillId);
    }
    await this.matrix.saveSkills(memberId, save, clear);
    return this.build(memberId);
  }

  private async assertMember(id: string): Promise<MemberPosition> {
    const position = await this.refs.memberPosition(id);
    if (!position) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    return position;
  }
}
