import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { PROBLEM_LOG } from "../ports/problem-log";
import { ProblemLog } from "./application/problem-log";
import { Records } from "./application/records";
import { RecordsList } from "./application/records-list";
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
    RecordsList,
    ProblemLog,
    { provide: PROBLEM_LOG, useExisting: ProblemLog },
  ],
  exports: [PROBLEM_LOG, AttachmentStorage],
})
export class RegistroModule {}
