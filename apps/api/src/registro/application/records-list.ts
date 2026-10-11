import { Inject, Injectable } from "@nestjs/common";
import type { BoardDto, FeedbackBoardDto, MemberRecordSummaryDto, ProblemBoardDto, RecordPageDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { RecordRepository } from "../infra/record.repository";
import type { RecordListFilter } from "../domain/record-list";

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

  async memberSummary(memberId: string, now: Date = new Date()): Promise<MemberRecordSummaryDto> {
    if (!(await this.refs.memberExists(memberId))) {
      throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    }
    return this.records.memberSummary(memberId, now);
  }
}
