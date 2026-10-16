import { Inject, Injectable } from "@nestjs/common";
import { catalogForCategory, type MemberMatrixDto, type MemberPosition } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import {
  assertMatrixEditable,
  assertSkillInCategory,
  buildMatrix,
  normalizeEntry,
  requireEquipments,
  requireSkill,
  type MatrixEntry,
} from "../domain/matrix";
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
    const [{ equipments, entries, gradeName, expectedByLevel, matrixCategory }, catalog] = await Promise.all([
      this.matrix.load(memberId),
      this.catalog.load(),
    ]);
    // A aderência conta só as habilidades da categoria da função; as notas de outra categoria ficam guardadas.
    const ownCatalog = catalogForCategory(catalog, matrixCategory);
    return { memberId, gradeName, expectedByLevel, matrixCategory, entries, ...buildMatrix(ownCatalog, equipments, entries, expectedByLevel) };
  }

  async setEquipments(memberId: string, body: unknown): Promise<MemberMatrixDto> {
    assertMatrixEditable(await this.assertMember(memberId));
    const [{ equipments: current }, catalog] = await Promise.all([this.matrix.load(memberId), this.catalog.load()]);
    await this.matrix.replaceEquipments(memberId, requireEquipments(parseEquipments(body), catalog, current));
    return this.build(memberId);
  }

  async setSkill(memberId: string, skillId: string, body: unknown): Promise<MemberMatrixDto> {
    const [position, catalog, category] = await Promise.all([
      this.assertMember(memberId),
      this.catalog.load(),
      this.matrix.memberCategory(memberId),
    ]);
    assertMatrixEditable(position);
    const skill = requireSkill(skillId, catalog);
    assertSkillInCategory(skill, category);
    const entry = normalizeEntry(skill.id, parseEntry(body));
    if (entry) await this.matrix.saveSkill(memberId, entry);
    else await this.matrix.clearSkill(memberId, skill.id);
    return this.build(memberId);
  }

  async setSkills(memberId: string, body: unknown): Promise<MemberMatrixDto> {
    const [position, catalog, category] = await Promise.all([
      this.assertMember(memberId),
      this.catalog.load(),
      this.matrix.memberCategory(memberId),
    ]);
    assertMatrixEditable(position);
    const save: MatrixEntry[] = [];
    const clear: string[] = [];
    for (const { skillId, input } of parseBulk(body)) {
      const skill = requireSkill(skillId, catalog);
      assertSkillInCategory(skill, category);
      const entry = normalizeEntry(skill.id, input);
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
