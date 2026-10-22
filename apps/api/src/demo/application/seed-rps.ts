import { rpWhatsappText, type PublicRpBody, type RpBulkReviewBody, type RpFields } from "@manutencao/shared";
import { demoDay } from "../domain/demo-calendar";
import { demoCatalog, demoMachines } from "../domain/demo-catalog";
import { demoPeople } from "../domain/demo-people";
import { DEMO_RPS, demoRpCauses, type DemoRp } from "../domain/demo-rps";
import type { DemoIds, DemoServices } from "./demo-services";

type RpsContext = { services: DemoServices; ids: DemoIds; today: Date };
type PublicCodes = { team: string; supervisor: string };

// O que o supervisor escreve quando pede revisão ou recusa pela página pública.
const REVIEW_NOTES: Record<RpBulkReviewBody["action"], string | undefined> = {
  approve: undefined,
  request_review: "Faltou dizer qual peça foi trocada.",
  reject: "Esse caso já está no RP 0003.",
};

/**
 * Links da página pública (equipe e Supervisor 1) e os RPs: os colados pelo gestor e os da página
 * pública, com aprovação, pedido de revisão e recusa do supervisor. Grava em `ids`: rp (pelo nº da ordem).
 * @example await seedRps({ services, ids, today })
 */
export async function seedRps(context: RpsContext): Promise<void> {
  const codes = await seedPublicLinks(context);
  for (const rp of DEMO_RPS) {
    if (rp.channel === "paste") await seedPastedRp(context, rp);
    else await seedPublicRp(context, rp, codes);
  }
}

async function seedPublicLinks({ services, ids }: RpsContext): Promise<PublicCodes> {
  const { link } = await services.publicLinks.replace();
  if (!link) throw new Error("Demonstração: o link público de RPs não foi criado.");
  const supervisor = await services.supervisorLinks.create({ memberId: ids.get("person", "s1") });
  await services.supervisorLinks.create({ memberId: ids.get("person", "s2") });
  return { team: link.code, supervisor: supervisor.code };
}

async function seedPastedRp({ services, ids, today }: RpsContext, rp: DemoRp): Promise<void> {
  const fields = rpFields(ids, today, rp);
  const rawText = rpWhatsappText({ ...fields, technicians: rp.members.map(personName) });
  const created = await services.rps.createFrom({ fields, occurredAt: new Date(fields.occurredAt), rawText, chamadoId: null }, "paste");
  ids.set("rp", rp.orderNumber, created.id);
}

// A página pública não escolhe subconjunto: isso fica para o coordenador.
async function seedPublicRp({ services, ids, today }: RpsContext, rp: DemoRp, codes: PublicCodes): Promise<void> {
  const { subassemblyId: _subassembly, unmatchedTechnicians: _unmatched, ...fields } = rpFields(ids, today, rp);
  const body: PublicRpBody = fields;
  const created = await services.publicRps.create(codes.team, body);
  ids.set("rp", rp.orderNumber, created.id);
  if (!rp.review) return;
  const review: RpBulkReviewBody = { ids: [created.id], action: rp.review, note: REVIEW_NOTES[rp.review] };
  await services.publicRps.bulkReview(codes.supervisor, review);
}

type RpPlace = Pick<RpFields, "factoryId" | "lineId" | "line" | "tag" | "machineId" | "subassemblyId">;

function rpPlace(ids: DemoIds, rp: DemoRp): RpPlace {
  const catalog = demoCatalog();
  const machine = demoMachines(catalog).find((item) => item.key === rp.machine);
  const line = catalog.lines.find((item) => item.key === machine?.line);
  if (!machine || !line) throw new Error(`Demonstração: o RP ${rp.orderNumber} aponta para a máquina "${rp.machine}", que não existe; esperava m1 a m10.`);
  return {
    factoryId: ids.get("factory", line.factory),
    lineId: ids.get("line", line.key),
    line: line.name,
    tag: machine.tag,
    machineId: ids.get("machine", machine.key),
    subassemblyId: ids.get("subassembly", `${machine.model}|${rp.subassembly}`),
  };
}

function rpFields(ids: DemoIds, today: Date, rp: DemoRp): RpFields {
  return {
    ...rpPlace(ids, rp),
    occurredAt: new Date(`${demoDay(today, rp.daysAgo)}T12:00:00.000Z`).toISOString(),
    orderNumber: rp.orderNumber,
    problem: rp.problem,
    description: rp.description,
    repeatedFailure: rp.repeatedTimes !== null,
    repeatedTimes: rp.repeatedTimes,
    repeatedPeriod: rp.repeatedTimes === null ? null : "Últimos 30 dias",
    causes: demoRpCauses(rp.causes),
    rootCause: rp.rootCause,
    corrective: rp.corrective,
    preventive: rp.preventive,
    status: rp.status,
    basicConditionImpact: null,
    memberIds: rp.members.map((member) => ids.get("person", member)),
    unmatchedTechnicians: null,
  };
}

function personName(key: string): string {
  const person = demoPeople().people.find((item) => item.key === key);
  if (!person) throw new Error(`Demonstração: pessoa "${key}" não existe; esperava s1 a s3 ou c1 a c12.`);
  return person.name;
}
