import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { RegistroModule } from "../registro/registro.module";
import { Chamados } from "./application/chamados";
import { NoteOcorrencia } from "./application/note-ocorrencia";
import { TurnoController } from "./http/turno.controller";
import { ChamadoRepository } from "./infra/chamado.repository";

@Module({
  imports: [CadastroModule, RegistroModule],
  controllers: [TurnoController],
  providers: [Chamados, ChamadoRepository, NoteOcorrencia],
})
export class TurnoModule {}
