import { Module } from "@nestjs/common";
import { CADASTRO_REFS } from "../ports/cadastro-refs";
import { Factories } from "./application/factories";
import { Machines } from "./application/machines";
import { Roles } from "./application/roles";
import { SeedRoles } from "./application/seed-roles";
import { Technicians } from "./application/technicians";
import { FactoriesController } from "./http/factories.controller";
import { MachinesController } from "./http/machines.controller";
import { RolesController } from "./http/roles.controller";
import { TechniciansController } from "./http/technicians.controller";
import { PrismaCadastroRefs } from "./infra/cadastro-refs.prisma";
import { FactoryRepository } from "./infra/factory.repository";
import { MachineRepository } from "./infra/machine.repository";
import { RoleRepository } from "./infra/role.repository";
import { TechnicianRepository } from "./infra/technician.repository";

@Module({
  controllers: [FactoriesController, MachinesController, RolesController, TechniciansController],
  providers: [
    FactoryRepository,
    MachineRepository,
    RoleRepository,
    TechnicianRepository,
    PrismaCadastroRefs,
    { provide: CADASTRO_REFS, useExisting: PrismaCadastroRefs },
    SeedRoles,
    Factories,
    Machines,
    Roles,
    Technicians,
  ],
  exports: [CADASTRO_REFS],
})
export class CadastroModule {}
