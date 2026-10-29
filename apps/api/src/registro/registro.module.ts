import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { PROBLEM_LOG } from "../ports/problem-log";
import { ProblemLog } from "./application/problem-log";
import { Records } from "./application/records";
import { RecordsList } from "./application/records-list";
import { TASK_REPEAT_STORE } from "./application/task-repeat-ports";
import { TaskRepeats } from "./application/task-repeats";
import { MemberRecordsController } from "./http/member-records.controller";
import { RecordsController } from "./http/records.controller";
import { AttachmentStorage } from "./infra/attachment.storage";
import { RecordRepository } from "./infra/record.repository";
import { TaskRepeatRepository } from "./infra/task-repeat.repository";

@Module({
  imports: [CadastroModule],
  controllers: [RecordsController, MemberRecordsController],
  providers: [
    RecordRepository,
    AttachmentStorage,
    Records,
    RecordsList,
    { provide: TASK_REPEAT_STORE, useClass: TaskRepeatRepository },
    TaskRepeats,
    ProblemLog,
    { provide: PROBLEM_LOG, useExisting: ProblemLog },
  ],
  exports: [PROBLEM_LOG, AttachmentStorage],
})
export class RegistroModule {}
