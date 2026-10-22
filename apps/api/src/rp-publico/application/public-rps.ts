import { Inject, Injectable } from "@nestjs/common";
import type {
  PublicRpAccessDto,
  PublicRpDirectoryDto,
  PublicRpDto,
  PublicRpPageDto,
  RpBulkAction,
  RpBulkReviewResultDto,
  RpDraftDto,
  RpDto,
  RpRevisionKind,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { parseRpText } from "../../rp/application/parse-rp";
import type { RpListQuery } from "../../rp/application/parse-rp-list";
import { rpDrafts } from "../../rp/application/rp-drafts";
import { decisionPatch, type RpDecisionPatch } from "../../rp/domain/rp-decision";
import type { PublicWriteLimiter } from "../domain/write-limiter";
import { publicRpManifest, type PublicRpManifest } from "../domain/public-rp-manifest";
import { publicFieldsOf, toPublicListItem, toPublicRp } from "../domain/public-rp-view";
import { parseBulkReview } from "./parse-bulk-review";
import { parsePublicRp, parseReviewRequest } from "./parse-public-rp";
import { PublicLinks } from "./public-links";
import {
  PUBLIC_CLOCK,
  PUBLIC_DIRECTORY_STORE,
  PUBLIC_WRITE_LIMITER,
  RP_BOOK,
  RP_REVISION_STORE,
  type Clock,
  type PublicDirectoryStore,
  type RpBook,
  type RpRevisionStore,
} from "./ports";

// Filtros que a lista pública aceita; a origem é sempre "public". Os mesmos da lista do coordenador,
// menos Fábrica e Linha do texto (pedido do Léo, 2026-10-22).
const PUBLIC_FILTERS = ["memberId", "status", "review", "checked", "decision", "q", "from", "to", "lineId", "tag", "repeated", "cursor", "limit"] as const;

function publicQuery(query: RpListQuery): RpListQuery {
  const picked: RpListQuery = { source: "public" };
  for (const key of PUBLIC_FILTERS) if (query[key] !== undefined) picked[key] = query[key];
  return picked;
}

const REVISION_KIND: Record<RpBulkAction, RpRevisionKind> = { approve: "approve", reject: "reject", request_review: "review_request" };

// Editar pelo link devolve o RP para avaliação: sai aprovado e recusado. O pedido de revisão só sai
// quando o técnico marca "Revisado".
function editReset(current: RpDto, revised: boolean): RpDecisionPatch {
  const patch: RpDecisionPatch = {};
  if (current.checkedAt) patch.checkedAt = null;
  if (current.rejectedAt) Object.assign(patch, { rejectedAt: null, rejectionNote: null });
  if (revised && current.reviewRequestedAt) Object.assign(patch, { reviewRequest: null, reviewRequestedAt: null });
  return patch;
}

/**
 * O que a página pública faz, sempre depois de conferir o código do link: lista, lê, cria e edita
 * só os RPs nascidos nela. Aprovar, recusar e pedir revisão só pelo link de um supervisor, com o nome dele
 * no histórico. Toda edição e avaliação vai para o histórico.
 * @example await publicRps.create(code, body)
 */
@Injectable()
export class PublicRps {
  constructor(
    private readonly links: PublicLinks,
    @Inject(RP_BOOK) private readonly rps: RpBook,
    @Inject(PUBLIC_DIRECTORY_STORE) private readonly people: PublicDirectoryStore,
    @Inject(RP_REVISION_STORE) private readonly revisions: RpRevisionStore,
    @Inject(PUBLIC_WRITE_LIMITER) private readonly limiter: PublicWriteLimiter,
    @Inject(PUBLIC_CLOCK) private readonly clock: Clock,
  ) {}

  // A tela pergunta quem é o link para mostrar ou esconder o que é só do supervisor.
  access(code: string): Promise<PublicRpAccessDto> {
    return this.links.assertActive(code);
  }

  // Manifesto do app instalado pelo link; link trocado ou removido dá 404 e o celular não oferece instalar.
  async manifest(code: string): Promise<PublicRpManifest> {
    return publicRpManifest(code, await this.links.assertActive(code));
  }

  async directory(code: string): Promise<PublicRpDirectoryDto> {
    await this.links.assertActive(code);
    return this.people.directory();
  }

  /**
   * O técnico cola o RP que já mandou no WhatsApp e o formulário vem preenchido. Não grava nada; só os técnicos
   * liberados na página pública entram, o resto vira aviso.
   * @example (await publicRps.parse(code, { text }))[0].memberIds // ["m1"]
   */
  async parse(code: string, body: unknown): Promise<RpDraftDto[]> {
    await this.links.assertActive(code);
    const text = parseRpText(body);
    const directory = await this.people.directory();
    const members = directory.members.map((member) => ({ ...member, active: true }));
    return rpDrafts(text, members, directory.lines);
  }

  async page(code: string, query: RpListQuery): Promise<PublicRpPageDto> {
    await this.links.assertActive(code);
    const page = await this.rps.page(publicQuery(query));
    const names = await this.people.memberNames(page.items.flatMap((item) => item.memberIds));
    return { items: page.items.map((item) => toPublicListItem(item, names)), nextCursor: page.nextCursor };
  }

  async get(code: string, id: string): Promise<PublicRpDto> {
    await this.links.assertActive(code);
    return this.view(await this.publicRp(id));
  }

  async create(code: string, body: unknown): Promise<PublicRpDto> {
    await this.links.assertActive(code);
    this.limiter.take("create");
    const allowed = new Set(await this.people.allowedMemberIds());
    const { input } = parsePublicRp(body, allowed, null);
    return this.view(await this.rps.createFrom(input, "public"));
  }

  async update(code: string, id: string, body: unknown): Promise<PublicRpDto> {
    await this.links.assertActive(code);
    this.limiter.take("write");
    const current = await this.publicRp(id);
    // Quem saiu da lista do formulário continua valendo no RP que já tinha.
    const allowed = new Set([...(await this.people.allowedMemberIds()), ...current.memberIds]);
    const { input, revised } = parsePublicRp(body, allowed, current);
    let saved = await this.rps.updateFrom(id, input);
    await this.revisions.add({ rpId: id, kind: "edit", before: publicFieldsOf(current), note: null });
    const reset = editReset(current, revised);
    if (Object.keys(reset).length) saved = await this.rps.setDecision(id, reset);
    return this.view(saved);
  }

  async requestReview(code: string, id: string, body: unknown): Promise<PublicRpDto> {
    const actorName = await this.links.assertSupervisor(code);
    this.limiter.take("write");
    const current = await this.publicRp(id);
    const text = parseReviewRequest(body);
    await this.revisions.add({ rpId: id, kind: "review_request", before: publicFieldsOf(current), note: text, actorName });
    return this.view(await this.rps.setDecision(id, decisionPatch("request_review", this.clock(), text)));
  }

  // Aprovar, recusar ou pedir revisão de vários RPs. Confere todos antes de gravar: um id fora da página
  // pública barra o lote inteiro.
  async bulkReview(code: string, body: unknown): Promise<RpBulkReviewResultDto> {
    const actorName = await this.links.assertSupervisor(code);
    this.limiter.take("write");
    const { ids, action, note } = parseBulkReview(body);
    const rps = await Promise.all(ids.map((id) => this.publicRp(id)));
    const patch = decisionPatch(action, this.clock(), note);
    for (const rp of rps) {
      await this.revisions.add({ rpId: rp.id, kind: REVISION_KIND[action], before: publicFieldsOf(rp), note, actorName });
      await this.rps.setDecision(rp.id, patch);
    }
    return { updated: rps.length };
  }

  // RP colado no app não existe para a página pública: mesma resposta de id inexistente.
  private async publicRp(id: string): Promise<RpDto> {
    const rp = await this.rps.get(id);
    if (rp.source !== "public") throw new DomainError("not_found", 404, "RP não encontrado.");
    return rp;
  }

  private async view(rp: RpDto): Promise<PublicRpDto> {
    return toPublicRp(rp, await this.people.memberNames(rp.memberIds));
  }
}
