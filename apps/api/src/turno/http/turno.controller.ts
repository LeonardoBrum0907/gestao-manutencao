import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Chamados } from "../application/chamados";
import { NoteOcorrencia } from "../application/note-ocorrencia";
import type { ChamadoListQuery } from "../application/parse-shift";

@Controller("api/turno")
export class TurnoController {
  constructor(
    private readonly chamados: Chamados,
    private readonly ocorrencias: NoteOcorrencia,
  ) {}

  @Get("chamados")
  list(@Query() query: ChamadoListQuery) {
    return this.chamados.list(query);
  }

  @Get("chamados/:id")
  get(@Param("id") id: string) {
    return this.chamados.get(id);
  }

  @Post("chamados")
  open(@Body() body: unknown) {
    return this.chamados.open(body);
  }

  @Patch("chamados/:id")
  editChamado(@Param("id") id: string, @Body() body: unknown) {
    return this.chamados.edit(id, body);
  }

  @Post("chamados/:id/tarefas")
  addTask(@Param("id") id: string, @Body() body: unknown) {
    return this.chamados.addTask(id, body);
  }

  // Ocorrência saiu do menu; só as antigas ainda se editam pela ficha.
  @Patch("ocorrencias/:id")
  editOcorrencia(@Param("id") id: string, @Body() body: unknown) {
    return this.ocorrencias.replace(id, body);
  }
}
