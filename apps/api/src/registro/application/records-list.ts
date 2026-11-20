import { Inject, Injectable } from "@nestjs/common";
import type { BoardDto, FeedbackBoardDto, MemberRecordSummaryDto, ProblemBoardDto, RecordPageDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { RecordRepository } from "../infra/record.repository";
import type { RecordListFilter } from "../domain/record-list";
import { parseRecordList, type RecordListQuery } from "./parse-record-list";

@Injectable()
export class RecordsList {
  constructor(
    private readonly records: RecordRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  page(filter: RecordListFilter, now: Date = new Date()): Promise<RecordPageDto> {
    return this.records.listPage(filter, now);
  }

  taskBoard(now: Date = new Date()): Promise<BoardDto> {
    return this.records.taskBoard(now);
  }

  problemBoard(now: Date = new Date()): Promise<ProblemBoardDto> {
    return this.records.problemBoard(now);
  }

  feedbackBoard(now: Date = new Date()): Promise<FeedbackBoardDto> {
    return this.records.feedbackBoard(now);
  }

  /**
   * Cartão Feedbacks da ficha: só os feedbacks gravados nela. As observações de Registros vêm de GET /api/records?memberId.
   * @example list.memberFeedbacks("m1", { cursor: "r9" })
   */
  async memberFeedbacks(memberId: string, query: RecordListQuery, now: Date = new Date()): Promise<RecordPageDto> {
    const filter = parseRecordList({ cursor: query.cursor, limit: query.limit, memberId, type: "feedback" });
    return this.records.listPage(filter, now, "ficha");
  }

  async memberSummary(memberId: string, now: Date = new Date()): Promise<MemberRecordSummaryDto> {
    if (!(await this.refs.memberExists(memberId))) {
      throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    }
    return this.records.memberSummary(memberId, now);
  }
}
