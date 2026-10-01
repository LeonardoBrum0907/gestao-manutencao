import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { NoteOcorrencia } from "../application/note-ocorrencia";
import { OpenChamado } from "../application/open-chamado";

@Controller("api/turno")
export class TurnoController {
  constructor(
    private readonly chamados: OpenChamado,
    private readonly ocorrencias: NoteOcorrencia,
  ) {}

  @Post("chamados")
  open(@Body() body: unknown) {
    return this.chamados.execute(body);
  }

  @Patch("chamados/:id")
  editChamado(@Param("id") id: string, @Body() body: unknown) {
    return this.chamados.replace(id, body);
  }

  @Post("ocorrencias")
  note(@Body() body: unknown) {
    return this.ocorrencias.execute(body);
  }

  @Patch("ocorrencias/:id")
  editOcorrencia(@Param("id") id: string, @Body() body: unknown) {
    return this.ocorrencias.replace(id, body);
  }
}
