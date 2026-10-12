import { Inject, Injectable } from "@nestjs/common";
import type { TransferDetailDto, TransferListDto, TransferSummaryDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { byEquipment, gapsOf, masteredSkills } from "../domain/transfer-progress";
import { evolutionOf } from "../domain/transfer-timeline";
import { bookOf, booksByMember, historyByMember, summaryOf, type TransferContext } from "./transfer-summary";
import { TRANSFER_CATALOG, TRANSFER_STORE, type TransferCatalog, type TransferRow, type TransferStore } from "./transfer-store";

// Em andamento antes dos encerrados; dentro de cada grupo, pelo nome de quem aprende.
function listOrder(a: TransferSummaryDto, b: TransferSummaryDto): number {
  return Number(a.status === "closed") - Number(b.status === "closed") || a.learner.name.localeCompare(b.learner.name, "pt-BR");
}

/** Leitura dos repasses: a lista com o número da cultura e a tela de um par. */
@Injectable()
export class TransferBoard {
  constructor(
    @Inject(TRANSFER_STORE) private readonly store: TransferStore,
    @Inject(TRANSFER_CATALOG) private readonly catalog: TransferCatalog,
  ) {}

  async list(now = new Date()): Promise<TransferListDto> {
    const [rows, technicians] = await Promise.all([this.store.transfers(), this.store.technicians()]);
    const context = await this.contextFor(rows, now);
    const transfers = rows.map((row) => summaryOf(row, context)).sort(listOrder);
    const teaching = new Set(rows.filter((row) => row.status === "active").map((row) => row.teacherId));
    return { transfers, technicians: technicians.length, teaching: teaching.size };
  }

  async detail(id: string, now = new Date()): Promise<TransferDetailDto> {
    const row = await this.store.transfer(id);
    if (!row) throw new DomainError("not_found", 404, `Repasse "${id}" não encontrado.`);
    const context = await this.contextFor([row], now);
    const mastered = masteredSkills(context.catalog, row.equipmentIds, bookOf(context, row.teacherId));
    const learner = bookOf(context, row.learnerId);
    const openPdi = await this.store.openPdiItems(row.learnerId, mastered.map((skill) => skill.id));
    const sources = { teacher: bookOf(context, row.teacherId), learner, openPdiBySkill: new Map(openPdi.map((item) => [item.skillId, item.id])) };
    return {
      ...summaryOf(row, context),
      byEquipment: byEquipment(context.catalog, mastered, learner),
      gaps: gapsOf(context.catalog, mastered, sources),
      evolution: evolutionOf(mastered, context.history.get(row.learnerId) ?? [], row.startedAt, now),
    };
  }

  private async contextFor(rows: readonly TransferRow[], now: Date): Promise<TransferContext> {
    const ids = [...new Set(rows.flatMap((row) => [row.teacherId, row.learnerId]))];
    const learnerIds = [...new Set(rows.map((row) => row.learnerId))];
    const [catalog, people, scores, history] = await Promise.all([
      this.catalog.load(),
      this.store.members(ids),
      this.store.scores(ids),
      this.store.history(learnerIds),
    ]);
    return { catalog, people: new Map(people.map((member) => [member.id, member])), books: booksByMember(scores), history: historyByMember(history), now };
  }
}
