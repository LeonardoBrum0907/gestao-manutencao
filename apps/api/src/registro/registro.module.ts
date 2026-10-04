import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { PROBLEM_LOG } from "../ports/problem-log";
import { FollowUpList } from "./application/follow-up-list";
import { MemberRecords } from "./application/member-records";
import { ProblemLog } from "./application/problem-log";
import { Records } from "./application/records";
import { MemberRecordsController } from "./http/member-records.controller";
import { RecordsController } from "./http/records.controller";
import { AttachmentStorage } from "./infra/attachment.storage";
import { RecordRepository } from "./infra/record.repository";

@Module({
  imports: [CadastroModule],
  controllers: [RecordsController, MemberRecordsController],
  providers: [
    RecordRepository,
    AttachmentStorage,
    Records,
    FollowUpList,
    MemberRecords,
    ProblemLog,
    { provide: PROBLEM_LOG, useExisting: ProblemLog },
  ],
  exports: [PROBLEM_LOG],
})
export class RegistroModule {}
