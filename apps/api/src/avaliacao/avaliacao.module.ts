import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { MemberBehavior } from "./application/member-behavior";
import { BehaviorController } from "./http/behavior.controller";
import { BehaviorRepository } from "./infra/behavior.repository";

@Module({
  imports: [CadastroModule],
  controllers: [BehaviorController],
  providers: [BehaviorRepository, MemberBehavior],
})
export class AvaliacaoModule {}
