import { Controller, Delete, Get, Post } from "@nestjs/common";
import { PublicLinks } from "../application/public-links";

// O coordenador (com login) gera, troca e desliga o link da página pública.
@Controller("api/rp-public-link")
export class RpPublicLinkController {
  constructor(private readonly links: PublicLinks) {}

  @Get()
  state() {
    return this.links.state();
  }

  @Post()
  replace() {
    return this.links.replace();
  }

  @Delete()
  disable() {
    return this.links.disable();
  }
}
