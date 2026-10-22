import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { INestApplicationContext, Type } from "@nestjs/common";
import { AppModule } from "../app.module";
import { BehaviorTags } from "../avaliacao/application/behavior-tags";
import { Competencies } from "../avaliacao/application/competencies";
import { MemberBehavior } from "../avaliacao/application/member-behavior";
import { MemberPdi } from "../avaliacao/application/member-pdi";
import { MemberPdiItems } from "../avaliacao/application/member-pdi-items";
import { MemberPerformance } from "../avaliacao/application/member-performance";
import { Factories } from "../cadastro/application/factories";
import { Grades } from "../cadastro/application/grades";
import { Lines } from "../cadastro/application/lines";
import { Machines } from "../cadastro/application/machines";
import { Members } from "../cadastro/application/members";
import { Roles } from "../cadastro/application/roles";
import { Subassemblies } from "../cadastro/application/subassemblies";
import { Teams } from "../cadastro/application/teams";
import { MatrixCatalog } from "../competencia/application/matrix-catalog";
import { MemberMatrix } from "../competencia/application/member-matrix";
import { TechCards } from "../documentacao/application/tech-cards";
import { PostPreventives } from "../pos-preventiva/application/post-preventives";
import { PrismaService } from "../prisma/prisma.service";
import { Records } from "../registro/application/records";
import { Rps } from "../rp/application/rps";
import { PublicLinks } from "../rp-publico/application/public-links";
import { PublicRps } from "../rp-publico/application/public-rps";
import { RpReviews } from "../rp-publico/application/rp-reviews";
import { SupervisorLinks } from "../rp-publico/application/supervisor-links";
import { Chamados } from "../turno/application/chamados";
import { runDemoSeed } from "./application/demo-seed";
import type { DemoServices } from "./application/demo-services";
import { PrismaDemoDatabase } from "./infra/demo-database";

// Carga de dados genéricos da demonstração. Roda dentro do container demo-api, chamada por
// `sudo caderno-admin demo dados` (deploy/vps/admin/caderno-admin): node apps/api/dist/demo/seed-demo.js

function servicesOf(app: INestApplicationContext): DemoServices {
  const get = <T>(type: Type<T>): T => app.get(type, { strict: false });
  return {
    factories: get(Factories), lines: get(Lines), machines: get(Machines), subassemblies: get(Subassemblies),
    matrixCatalog: get(MatrixCatalog), roles: get(Roles), grades: get(Grades), teams: get(Teams), members: get(Members),
    memberMatrix: get(MemberMatrix), performance: get(MemberPerformance), competencies: get(Competencies),
    behaviorTags: get(BehaviorTags), behavior: get(MemberBehavior), pdi: get(MemberPdi), pdiItems: get(MemberPdiItems),
    chamados: get(Chamados), records: get(Records), rps: get(Rps), publicLinks: get(PublicLinks),
    supervisorLinks: get(SupervisorLinks), publicRps: get(PublicRps), rpReviews: get(RpReviews),
    postPreventives: get(PostPreventives), techCards: get(TechCards),
  };
}

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });
  try {
    const database = new PrismaDemoDatabase(app.get(PrismaService, { strict: false }));
    await runDemoSeed(servicesOf(app), database, { now: new Date(), flag: process.env.DEMO_SEED, report: (line) => console.log(line) });
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
