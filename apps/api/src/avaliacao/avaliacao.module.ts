import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { MemberBehavior } from "./application/member-behavior";
import { MemberPerformance } from "./application/member-performance";
import { BehaviorController } from "./http/behavior.controller";
import { PerformanceController } from "./http/performance.controller";
import { BehaviorRepository } from "./infra/behavior.repository";
import { PerformanceRepository } from "./infra/performance.repository";

@Module({
  imports: [CadastroModule],
  controllers: [BehaviorController, PerformanceController],
  providers: [BehaviorRepository, MemberBehavior, PerformanceRepository, MemberPerformance],
})
export class AvaliacaoModule {}
