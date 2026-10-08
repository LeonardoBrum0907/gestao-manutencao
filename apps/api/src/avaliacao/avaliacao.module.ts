import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { RegistroModule } from "../registro/registro.module";
import { BehaviorTags } from "./application/behavior-tags";
import { Competencies } from "./application/competencies";
import { MemberBehavior } from "./application/member-behavior";
import { MemberPdi } from "./application/member-pdi";
import { MemberPdiItems } from "./application/member-pdi-items";
import { MemberPerformance } from "./application/member-performance";
import { BehaviorController } from "./http/behavior.controller";
import { BehaviorTagsController } from "./http/behavior-tags.controller";
import { CompetenciesController } from "./http/competencies.controller";
import { PdiController } from "./http/pdi.controller";
import { PdiItemsController } from "./http/pdi-items.controller";
import { PerformanceController } from "./http/performance.controller";
import { BehaviorRepository } from "./infra/behavior.repository";
import { BehaviorTagRepository } from "./infra/behavior-tag.repository";
import { CompetencyRepository } from "./infra/competency.repository";
import { PdiItemRepository } from "./infra/pdi-item.repository";
import { PdiRepository } from "./infra/pdi.repository";
import { PerformanceRepository } from "./infra/performance.repository";

@Module({
  imports: [CadastroModule, RegistroModule],
  controllers: [BehaviorController, PerformanceController, PdiController, PdiItemsController, CompetenciesController, BehaviorTagsController],
  providers: [
    BehaviorRepository,
    MemberBehavior,
    BehaviorTagRepository,
    BehaviorTags,
    PerformanceRepository,
    MemberPerformance,
    PdiRepository,
    MemberPdi,
    PdiItemRepository,
    MemberPdiItems,
    CompetencyRepository,
    Competencies,
  ],
})
export class AvaliacaoModule {}
