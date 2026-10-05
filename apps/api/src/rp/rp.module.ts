import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { RegistroModule } from "../registro/registro.module";
import { Rps } from "./application/rps";
import { MemberRpController } from "./http/member-rp.controller";
import { RpController } from "./http/rp.controller";
import { RpRepository } from "./infra/rp.repository";

@Module({
  imports: [CadastroModule, RegistroModule],
  controllers: [RpController, MemberRpController],
  providers: [RpRepository, Rps],
})
export class RpModule {}
