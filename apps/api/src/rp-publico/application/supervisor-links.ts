import { Inject, Injectable } from "@nestjs/common";
import type { RpSupervisorLinkDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredString } from "../../kernel/parse";
import { newPublicLinkCode } from "../domain/link-code";
import { PUBLIC_CLOCK, SUPERVISOR_LINK_STORE, type Clock, type SupervisorLinkStore, type SupervisorMember } from "./ports";

/**
 * O colaborador escolhido para receber o link.
 * @example parseSupervisorMemberId({ memberId: "m1" }) // "m1"
 */
export function parseSupervisorMemberId(body: unknown): string {
  return requiredString(readObject(body), "memberId", "Escolha o supervisor.");
}

function notFound(id: string): DomainError {
  return new DomainError("not_found", 404, `Link de supervisor não encontrado (id ${id}).`);
}

/**
 * Os links pessoais dos supervisores: o coordenador escolhe um supervisor do cadastro, troca o link
 * (o antigo para de abrir) ou remove. Um link ativo por supervisor.
 * @example await supervisorLinks.create({ memberId: "m1" })
 */
@Injectable()
export class SupervisorLinks {
  constructor(
    @Inject(SUPERVISOR_LINK_STORE) private readonly store: SupervisorLinkStore,
    @Inject(PUBLIC_CLOCK) private readonly clock: Clock,
  ) {}

  list(): Promise<RpSupervisorLinkDto[]> {
    return this.store.list();
  }

  async create(body: unknown): Promise<RpSupervisorLinkDto> {
    const supervisor = await this.supervisorWithoutLink(parseSupervisorMemberId(body));
    return this.store.create(supervisor, newPublicLinkCode(), this.clock());
  }

  async replace(id: string): Promise<RpSupervisorLinkDto> {
    const link = await this.store.replaceCode(id, newPublicLinkCode());
    if (!link) throw notFound(id);
    return link;
  }

  async revoke(id: string): Promise<void> {
    if (!(await this.store.revoke(id, this.clock()))) throw notFound(id);
  }

  private async supervisorWithoutLink(memberId: string): Promise<SupervisorMember> {
    const supervisor = await this.store.findSupervisor(memberId);
    if (!supervisor) {
      throw new DomainError("invalid", 400, `Colaborador ${memberId} não é supervisor: a função dele precisa liderar equipe.`);
    }
    const links = await this.store.list();
    if (links.some((link) => link.memberId === memberId)) {
      throw new DomainError("conflict", 409, `${supervisor.name} já tem link. Use Trocar link para gerar outro.`);
    }
    return supervisor;
  }
}
