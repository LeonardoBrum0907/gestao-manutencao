import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { RegistroModule } from "../registro/registro.module";
import { MemberBehavior } from "./application/member-behavior";
import { MemberPdi } from "./application/member-pdi";
import { MemberPerformance } from "./application/member-performance";
import { BehaviorController } from "./http/behavior.controller";
import { PdiController } from "./http/pdi.controller";
import { PerformanceController } from "./http/performance.controller";
import { BehaviorRepository } from "./infra/behavior.repository";
import { PdiRepository } from "./infra/pdi.repository";
import { PerformanceRepository } from "./infra/performance.repository";

@Module({
  imports: [CadastroModule, RegistroModule],
  controllers: [BehaviorController, PerformanceController, PdiController],
  providers: [BehaviorRepository, MemberBehavior, PerformanceRepository, MemberPerformance, PdiRepository, MemberPdi],
})
export class AvaliacaoModule {}
