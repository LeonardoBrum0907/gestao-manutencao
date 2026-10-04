import { Inject, Injectable } from "@nestjs/common";
import type { MemberRecordsDto, RecordDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { involves, sortForProfile, summarizeMemberRecords } from "../domain/member-records";
import { RecordRepository } from "../infra/record.repository";

function subject(record: RecordDto) {
  return {
    ...record,
    dueAt: record.dueAt ? new Date(record.dueAt) : null,
    occurredAt: new Date(record.occurredAt),
  };
}

@Injectable()
export class MemberRecords {
  constructor(
    private readonly records: RecordRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async execute(memberId: string, now: Date = new Date()): Promise<MemberRecordsDto> {
    if (!(await this.refs.memberExists(memberId))) {
      throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    }
    const mine = (await this.records.list()).filter((record) => involves(record, memberId));
    const subjects = mine.map((record) => ({ record, ...subject(record) }));
    return {
      summary: summarizeMemberRecords(subjects, now),
      records: sortForProfile(subjects).map((item) => item.record),
    };
  }
}
