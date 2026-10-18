import { Body, Controller, Delete, Get, HttpCode, Param, Post } from "@nestjs/common";
import { SupervisorLinks } from "../application/supervisor-links";

// O coordenador (com login) cria, troca e remove o link de cada supervisor.
@Controller("api/rp-supervisor-links")
export class RpSupervisorLinkController {
  constructor(private readonly links: SupervisorLinks) {}

  @Get()
  list() {
    return this.links.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.links.create(body);
  }

  @Post(":id/replace")
  replace(@Param("id") id: string) {
    return this.links.replace(id);
  }

  @Delete(":id")
  @HttpCode(204)
  revoke(@Param("id") id: string) {
    return this.links.revoke(id);
  }
}
