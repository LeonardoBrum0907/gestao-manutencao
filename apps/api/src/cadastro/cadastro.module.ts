import { Module } from "@nestjs/common";
import { CADASTRO_REFS } from "../ports/cadastro-refs";
import { Factories } from "./application/factories";
import { Grades } from "./application/grades";
import { Machines } from "./application/machines";
import { Roles } from "./application/roles";
import { SeedRoles } from "./application/seed-roles";
import { Members } from "./application/members";
import { Teams } from "./application/teams";
import { FactoriesController } from "./http/factories.controller";
import { GradesController } from "./http/grades.controller";
import { MachinesController } from "./http/machines.controller";
import { RolesController } from "./http/roles.controller";
import { MembersController } from "./http/members.controller";
import { TeamsController } from "./http/teams.controller";
import { PrismaCadastroRefs } from "./infra/cadastro-refs.prisma";
import { FactoryRepository } from "./infra/factory.repository";
import { GradeRepository } from "./infra/grade.repository";
import { MachineRepository } from "./infra/machine.repository";
import { RoleRepository } from "./infra/role.repository";
import { MemberRepository } from "./infra/member.repository";
import { TeamRepository } from "./infra/team.repository";

@Module({
  controllers: [FactoriesController, MachinesController, RolesController, GradesController, MembersController, TeamsController],
  providers: [
    FactoryRepository,
    MachineRepository,
    RoleRepository,
    GradeRepository,
    MemberRepository,
    TeamRepository,
    PrismaCadastroRefs,
    { provide: CADASTRO_REFS, useExisting: PrismaCadastroRefs },
    SeedRoles,
    Factories,
    Machines,
    Roles,
    Grades,
    Members,
    Teams,
  ],
  exports: [CADASTRO_REFS],
})
export class CadastroModule {}
