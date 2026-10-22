import { demoCatalog } from "../domain/demo-catalog";
import { demoChamados } from "../domain/demo-chamados";
import { assertDemoSeedAllowed } from "../domain/demo-guard";
import { demoPeople } from "../domain/demo-people";
import { demoRandom } from "../domain/demo-random";
import { DemoIds, type DemoDatabase, type DemoServices } from "./demo-services";
import { seedCadastro } from "./seed-cadastro";
import { seedDevelopment } from "./seed-development";
import { seedKnowledge } from "./seed-knowledge";
import { seedPeople } from "./seed-people";
import { seedRecords } from "./seed-records";
import { seedRps } from "./seed-rps";

// Semente fixa: toda carga gera os mesmos chamados e notas (só as datas andam com o dia).
const DEMO_SEED_NUMBER = 20261022;
// O cadastro "existe" desde quatro meses antes da carga, antes do chamado mais antigo.
const CADASTRO_AGE_DAYS = 120;

export type DemoSeedReport = (step: string) => void;

/**
 * Carga da demonstração: confere que o banco é novo e da demonstração, troca o catálogo de partida
 * pelos modelos genéricos e grava cadastro, equipe, matriz, chamados, registros, RPs e fichas.
 * @example await runDemoSeed(services, database, { now: new Date(), flag: process.env.DEMO_SEED, report: console.log })
 */
export async function runDemoSeed(
  services: DemoServices,
  database: DemoDatabase,
  options: { now: Date; flag: string | undefined; report: DemoSeedReport },
): Promise<void> {
  const { now, report } = options;
  assertDemoSeedAllowed(options.flag, await database.counts());
  await database.removeStarterCatalog();
  const ids = new DemoIds();
  const random = demoRandom(DEMO_SEED_NUMBER);
  const catalog = demoCatalog();
  const people = demoPeople();
  await step(report, "cadastro", () => seedCadastro(services, catalog, ids));
  await step(report, "equipe", () => seedPeople(services, people, ids));
  await step(report, "matriz, avaliação e PDI", () => seedDevelopment({ services, ids, random, today: now }, people));
  await step(report, "chamados e registros", () => seedRecords({ services, database, ids, today: now }, demoChamados(now, random, catalog, people)));
  await step(report, "RPs", () => seedRps({ services, ids, today: now }));
  await step(report, "pós-preventivas e documentação", () => seedKnowledge({ services, ids, today: now }));
  await database.backdate(new Date(now.getTime() - CADASTRO_AGE_DAYS * 24 * 60 * 60 * 1000));
  report("Pronto: dados de demonstração carregados.");
}

async function step(report: DemoSeedReport, name: string, run: () => Promise<void>): Promise<void> {
  report(`Carregando ${name}…`);
  await run();
}
