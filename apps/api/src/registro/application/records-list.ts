import { Inject, Injectable } from "@nestjs/common";
import type { MemberRecordSummaryDto, RecordPageDto } from "@manutencao/shared";
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

  async memberSummary(memberId: string, now: Date = new Date()): Promise<MemberRecordSummaryDto> {
    if (!(await this.refs.memberExists(memberId))) {
      throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    }
    return this.records.memberSummary(memberId, now);
  }
}
