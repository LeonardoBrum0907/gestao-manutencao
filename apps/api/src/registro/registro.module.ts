import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { PROBLEM_LOG } from "../ports/problem-log";
import { FollowUpList } from "./application/follow-up-list";
import { ProblemLog } from "./application/problem-log";
import { Records } from "./application/records";
import { RecordsController } from "./http/records.controller";
import { AttachmentStorage } from "./infra/attachment.storage";
import { RecordRepository } from "./infra/record.repository";

@Module({
  imports: [CadastroModule],
  controllers: [RecordsController],
  providers: [
    RecordRepository,
    AttachmentStorage,
    Records,
    FollowUpList,
    ProblemLog,
    { provide: PROBLEM_LOG, useExisting: ProblemLog },
  ],
  exports: [PROBLEM_LOG],
})
export class RegistroModule {}
