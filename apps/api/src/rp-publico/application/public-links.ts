import { Inject, Injectable } from "@nestjs/common";
import type { PublicRpAccessDto, RpPublicLinkStateDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { isPublicLinkCodeShape, newPublicLinkCode } from "../domain/link-code";
import { PUBLIC_CLOCK, PUBLIC_LINK_STORE, SUPERVISOR_LINK_STORE, type Clock, type PublicLinkStore, type SupervisorLinkStore } from "./ports";

export const LINK_GONE_MESSAGE = "Este link de RPs não vale mais. Peça o link novo ao coordenador.";
export const SUPERVISOR_ONLY_MESSAGE =
  "Aprovar, recusar e pedir revisão só pelo link de um supervisor. Este é o link da equipe: peça o seu ao coordenador.";

/**
 * O link da página pública: o coordenador gera, troca (o antigo para de abrir) ou desliga. Além do link da equipe,
 * cada supervisor tem o seu (SupervisorLinks); os dois abrem a página, só o do supervisor avalia.
 * @example const access = await links.assertActive(code) // { role: "team" } ou { role: "supervisor", supervisorName }
 */
@Injectable()
export class PublicLinks {
  constructor(
    @Inject(PUBLIC_LINK_STORE) private readonly store: PublicLinkStore,
    @Inject(SUPERVISOR_LINK_STORE) private readonly supervisors: SupervisorLinkStore,
    @Inject(PUBLIC_CLOCK) private readonly clock: Clock,
  ) {}

  async state(): Promise<RpPublicLinkStateDto> {
    return { link: await this.store.active() };
  }

  async replace(): Promise<RpPublicLinkStateDto> {
    return { link: await this.store.replace(newPublicLinkCode(), this.clock()) };
  }

  async disable(): Promise<RpPublicLinkStateDto> {
    await this.store.revokeAll(this.clock());
    return { link: null };
  }

  // Código errado e link trocado dão a mesma resposta: não diz se um código já existiu.
  async assertActive(code: string): Promise<PublicRpAccessDto> {
    if (!isPublicLinkCodeShape(code)) throw new DomainError("not_found", 404, LINK_GONE_MESSAGE);
    if (await this.store.isActive(code)) return { role: "team" };
    const supervisor = await this.supervisors.findActive(code);
    if (!supervisor) throw new DomainError("not_found", 404, LINK_GONE_MESSAGE);
    return { role: "supervisor", supervisorName: supervisor.name };
  }

  /** Devolve o nome do supervisor dono do link; o link da equipe recebe 403. */
  async assertSupervisor(code: string): Promise<string> {
    const access = await this.assertActive(code);
    if (access.role !== "supervisor") throw new DomainError("forbidden", 403, SUPERVISOR_ONLY_MESSAGE);
    return access.supervisorName;
  }
}
