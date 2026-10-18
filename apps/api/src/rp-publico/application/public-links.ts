import { Inject, Injectable } from "@nestjs/common";
import type { RpPublicLinkStateDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { isPublicLinkCodeShape, newPublicLinkCode } from "../domain/link-code";
import { PUBLIC_CLOCK, PUBLIC_LINK_STORE, type Clock, type PublicLinkStore } from "./ports";

export const LINK_GONE_MESSAGE = "Este link de RPs não vale mais. Peça o link novo ao coordenador.";

/**
 * O link da página pública: o coordenador gera, troca (o antigo para de abrir) ou desliga.
 * @example await links.assertActive(code)
 */
@Injectable()
export class PublicLinks {
  constructor(
    @Inject(PUBLIC_LINK_STORE) private readonly store: PublicLinkStore,
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
  async assertActive(code: string): Promise<void> {
    if (!isPublicLinkCodeShape(code) || !(await this.store.isActive(code))) {
      throw new DomainError("not_found", 404, LINK_GONE_MESSAGE);
    }
  }
}
