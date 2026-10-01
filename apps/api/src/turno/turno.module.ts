import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { RegistroModule } from "../registro/registro.module";
import { NoteOcorrencia } from "./application/note-ocorrencia";
import { OpenChamado } from "./application/open-chamado";
import { TurnoController } from "./http/turno.controller";

@Module({
  imports: [CadastroModule, RegistroModule],
  controllers: [TurnoController],
  providers: [OpenChamado, NoteOcorrencia],
})
export class TurnoModule {}
