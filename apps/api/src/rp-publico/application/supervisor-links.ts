import { Inject, Injectable } from "@nestjs/common";
import type { RpSupervisorLinkDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredString } from "../../kernel/parse";
import { newPublicLinkCode } from "../domain/link-code";
import { PUBLIC_CLOCK, SUPERVISOR_LINK_STORE, type Clock, type SupervisorLinkStore } from "./ports";

export const SUPERVISOR_NAME_MAX = 60;

/**
 * Nome do supervisor como aparece no histórico do RP ("Aprovado por …").
 * @example parseSupervisorName({ name: " Carlos " }) // "Carlos"
 */
export function parseSupervisorName(body: unknown): string {
  const name = requiredString(readObject(body), "name", "Escreva o nome do supervisor.");
  if (name.length > SUPERVISOR_NAME_MAX) {
    throw new DomainError("invalid", 400, `Nome do supervisor longo demais (${name.length} caracteres; até ${SUPERVISOR_NAME_MAX}).`);
  }
  return name;
}

function notFound(id: string): DomainError {
  return new DomainError("not_found", 404, `Link de supervisor não encontrado (id ${id}).`);
}

/**
 * Os links pessoais dos supervisores: o coordenador cria um por pessoa, troca (o antigo para de abrir) ou remove.
 * @example await supervisorLinks.create({ name: "Carlos" })
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

  create(body: unknown): Promise<RpSupervisorLinkDto> {
    return this.store.create(parseSupervisorName(body), newPublicLinkCode(), this.clock());
  }

  async replace(id: string): Promise<RpSupervisorLinkDto> {
    const link = await this.store.replaceCode(id, newPublicLinkCode());
    if (!link) throw notFound(id);
    return link;
  }

  async revoke(id: string): Promise<void> {
    if (!(await this.store.revoke(id, this.clock()))) throw notFound(id);
  }
}
