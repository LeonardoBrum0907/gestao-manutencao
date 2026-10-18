import { Inject, Injectable } from "@nestjs/common";
import type { RpDto, RpRevisionDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredBoolean } from "../../kernel/parse";
import { decisionPatch } from "../../rp/domain/rp-decision";
import { publicFieldsOf } from "../domain/public-rp-view";
import { toRpInput } from "./parse-public-rp";
import { PUBLIC_CLOCK, PUBLIC_DIRECTORY_STORE, RP_BOOK, RP_REVISION_STORE, type Clock, type PublicDirectoryStore, type RpBook, type RpRevisionStore } from "./ports";

/**
 * O lado do coordenador: conferir RP da página pública, ver o histórico, desfazer uma edição
 * e liberar o técnico no formulário público.
 * @example await reviews.restore(rpId, revisionId)
 */
@Injectable()
export class RpReviews {
  constructor(
    @Inject(RP_BOOK) private readonly rps: RpBook,
    @Inject(RP_REVISION_STORE) private readonly revisions: RpRevisionStore,
    @Inject(PUBLIC_DIRECTORY_STORE) private readonly people: PublicDirectoryStore,
    @Inject(PUBLIC_CLOCK) private readonly clock: Clock,
  ) {}

  async setChecked(id: string, body: unknown): Promise<RpDto> {
    const checked = requiredBoolean(readObject(body), "checked");
    await this.rps.get(id);
    // Conferir no app é aprovar: tira a recusa e o pedido de revisão do supervisor.
    return this.rps.setDecision(id, checked ? decisionPatch("approve", this.clock(), null) : { checkedAt: null });
  }

  async list(id: string): Promise<RpRevisionDto[]> {
    await this.rps.get(id);
    return this.revisions.list(id);
  }

  // Volta os campos para como estavam antes da mudança escolhida; o estado de agora vai para o histórico.
  async restore(id: string, revisionId: string): Promise<RpDto> {
    const revision = await this.revisions.find(revisionId);
    if (!revision || revision.rpId !== id) throw new DomainError("not_found", 404, "Versão do histórico não encontrada.");
    const current = await this.rps.get(id);
    const saved = await this.rps.updateFrom(id, toRpInput(revision.before, current));
    await this.revisions.add({ rpId: id, kind: "restore", before: publicFieldsOf(current), note: null });
    return saved;
  }

  async setMemberPublicRp(memberId: string, body: unknown): Promise<{ id: string; publicRp: boolean }> {
    const enabled = requiredBoolean(readObject(body), "enabled");
    const member = await this.people.setMemberPublicRp(memberId, enabled);
    if (!member) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    return member;
  }
}
