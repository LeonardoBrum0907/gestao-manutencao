import { Inject, Injectable } from "@nestjs/common";
import type { PublicRpDirectoryDto, PublicRpDto, PublicRpPageDto, RpDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import type { RpListQuery } from "../../rp/application/parse-rp-list";
import type { PublicWriteLimiter } from "../domain/write-limiter";
import { publicFieldsOf, toPublicListItem, toPublicRp } from "../domain/public-rp-view";
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

// Filtros que a lista pública aceita; a origem é sempre "public".
const PUBLIC_FILTERS = ["memberId", "status", "review", "q", "from", "to", "lineId", "cursor", "limit"] as const;

function publicQuery(query: RpListQuery): RpListQuery {
  const picked: RpListQuery = { source: "public" };
  for (const key of PUBLIC_FILTERS) if (query[key] !== undefined) picked[key] = query[key];
  return picked;
}

/**
 * O que a página pública faz, sempre depois de conferir o código do link: lista, lê, cria e edita
 * só os RPs nascidos nela, e pede revisão. Toda edição e pedido de revisão vai para o histórico.
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

  async directory(code: string): Promise<PublicRpDirectoryDto> {
    await this.links.assertActive(code);
    return this.people.directory();
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
    if (current.checkedAt) saved = await this.rps.setChecked(id, null);
    if (revised && current.reviewRequestedAt) saved = await this.rps.setReviewRequest(id, null, null);
    return this.view(saved);
  }

  async requestReview(code: string, id: string, body: unknown): Promise<PublicRpDto> {
    await this.links.assertActive(code);
    this.limiter.take("write");
    const current = await this.publicRp(id);
    const text = parseReviewRequest(body);
    await this.revisions.add({ rpId: id, kind: "review_request", before: publicFieldsOf(current), note: text });
    return this.view(await this.rps.setReviewRequest(id, text, this.clock()));
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
