import { Inject, Injectable } from "@nestjs/common";
import type { MemberBehaviorDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { normalizeBehavior } from "../domain/behavior";
import { BehaviorRepository } from "../infra/behavior.repository";
import { parseBehavior } from "./parse-behavior";

@Injectable()
export class MemberBehavior {
  constructor(
    private readonly behaviors: BehaviorRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async show(memberId: string): Promise<MemberBehaviorDto> {
    await this.assertMember(memberId);
    return { memberId, ...(await this.behaviors.load(memberId)) };
  }

  async save(memberId: string, body: unknown): Promise<MemberBehaviorDto> {
    await this.assertMember(memberId);
    const behavior = normalizeBehavior(parseBehavior(body));
    await this.behaviors.save(memberId, behavior);
    return { memberId, ...behavior };
  }

  private async assertMember(id: string): Promise<void> {
    if (!(await this.refs.memberExists(id))) {
      throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    }
  }
}
