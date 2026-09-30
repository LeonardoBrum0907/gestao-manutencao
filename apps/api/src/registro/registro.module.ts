import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { Records } from "./application/records";
import { RecordsController } from "./http/records.controller";
import { AttachmentStorage } from "./infra/attachment.storage";
import { RecordRepository } from "./infra/record.repository";

@Module({
  imports: [CadastroModule],
  controllers: [RecordsController],
  providers: [RecordRepository, AttachmentStorage, Records],
})
export class RegistroModule {}
