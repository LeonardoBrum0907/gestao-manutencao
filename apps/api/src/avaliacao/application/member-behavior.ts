import { Inject, Injectable } from "@nestjs/common";
import type { MemberBehaviorDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { normalizeBehavior, orderTags } from "../domain/behavior";
import { BehaviorRepository } from "../infra/behavior.repository";
import { BehaviorTagRepository } from "../infra/behavior-tag.repository";
import { parseBehavior } from "./parse-behavior";

@Injectable()
export class MemberBehavior {
  constructor(
    private readonly behaviors: BehaviorRepository,
    private readonly tags: BehaviorTagRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async show(memberId: string): Promise<MemberBehaviorDto> {
    await this.assertMember(memberId);
    const [behavior, catalog] = await Promise.all([this.behaviors.load(memberId), this.tags.list()]);
    return { memberId, ...behavior, tags: orderTags(behavior.tags, catalog) };
  }

  async save(memberId: string, body: unknown): Promise<MemberBehaviorDto> {
    await this.assertMember(memberId);
    const [previous, catalog] = await Promise.all([this.behaviors.load(memberId), this.tags.list()]);
    const behavior = normalizeBehavior(parseBehavior(body), catalog, previous.tags);
    await this.behaviors.save(memberId, behavior);
    return { memberId, ...behavior };
  }

  private async assertMember(id: string): Promise<void> {
    if (!(await this.refs.memberExists(id))) {
      throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    }
  }
}
