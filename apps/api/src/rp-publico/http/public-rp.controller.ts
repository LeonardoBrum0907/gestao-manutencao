import { Body, Controller, Get, Header, Param, Patch, Post, Query } from "@nestjs/common";
import { Public } from "../../http/public";
import type { RpListQuery } from "../../rp/application/parse-rp-list";
import { PublicRps } from "../application/public-rps";

// Página pública de RPs: sem login, o código do link no caminho é a chave.
// noindex: buscador que esbarrar no endereço não guarda o conteúdo.
@Public()
@Controller("api/public/rp/:code")
export class PublicRpController {
  constructor(private readonly rps: PublicRps) {}

  @Get("directory")
  @Header("X-Robots-Tag", "noindex")
  directory(@Param("code") code: string) {
    return this.rps.directory(code);
  }

  @Get()
  @Header("X-Robots-Tag", "noindex")
  page(@Param("code") code: string, @Query() query: RpListQuery) {
    return this.rps.page(code, query);
  }

  @Get(":id")
  @Header("X-Robots-Tag", "noindex")
  get(@Param("code") code: string, @Param("id") id: string) {
    return this.rps.get(code, id);
  }

  @Post()
  create(@Param("code") code: string, @Body() body: unknown) {
    return this.rps.create(code, body);
  }

  @Patch(":id")
  update(@Param("code") code: string, @Param("id") id: string, @Body() body: unknown) {
    return this.rps.update(code, id, body);
  }

  @Post(":id/review-request")
  requestReview(@Param("code") code: string, @Param("id") id: string, @Body() body: unknown) {
    return this.rps.requestReview(code, id, body);
  }
}
