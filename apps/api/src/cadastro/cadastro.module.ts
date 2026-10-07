import { Module } from "@nestjs/common";
import { CADASTRO_REFS } from "../ports/cadastro-refs";
import { Factories } from "./application/factories";
import { Grades } from "./application/grades";
import { Lines } from "./application/lines";
import { Machines } from "./application/machines";
import { Roles } from "./application/roles";
import { SeedRoles } from "./application/seed-roles";
import { Members } from "./application/members";
import { Subassemblies } from "./application/subassemblies";
import { Teams } from "./application/teams";
import { FactoriesController } from "./http/factories.controller";
import { GradesController } from "./http/grades.controller";
import { LinesController } from "./http/lines.controller";
import { MachinesController } from "./http/machines.controller";
import { RolesController } from "./http/roles.controller";
import { MembersController } from "./http/members.controller";
import { SubassembliesController } from "./http/subassemblies.controller";
import { TeamsController } from "./http/teams.controller";
import { PrismaCadastroRefs } from "./infra/cadastro-refs.prisma";
import { FactoryRepository } from "./infra/factory.repository";
import { GradeRepository } from "./infra/grade.repository";
import { LineRepository } from "./infra/line.repository";
import { MachineRepository } from "./infra/machine.repository";
import { RoleRepository } from "./infra/role.repository";
import { MemberRepository } from "./infra/member.repository";
import { SubassemblyRepository } from "./infra/subassembly.repository";
import { TeamRepository } from "./infra/team.repository";

@Module({
  controllers: [FactoriesController, LinesController, MachinesController, SubassembliesController, RolesController, GradesController, MembersController, TeamsController],
  providers: [
    FactoryRepository,
    LineRepository,
    MachineRepository,
    SubassemblyRepository,
    RoleRepository,
    GradeRepository,
    MemberRepository,
    TeamRepository,
    PrismaCadastroRefs,
    { provide: CADASTRO_REFS, useExisting: PrismaCadastroRefs },
    SeedRoles,
    Factories,
    Lines,
    Machines,
    Subassemblies,
    Roles,
    Grades,
    Members,
    Teams,
  ],
  exports: [CADASTRO_REFS],
})
export class CadastroModule {}
