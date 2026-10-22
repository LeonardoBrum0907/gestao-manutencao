import { demoDay } from "../domain/demo-calendar";
import { demoCatalog, demoMachineModel } from "../domain/demo-catalog";
import { DEMO_POST_PREVENTIVES, DEMO_TECH_CARDS, type DemoPostPreventive, type DemoTechCard } from "../domain/demo-knowledge";
import type { DemoIds, DemoServices } from "./demo-services";

type KnowledgeContext = { services: DemoServices; ids: DemoIds; today: Date };

/**
 * Fichas pós-preventiva (com o ponto de atenção ativo) e fichas de documentação técnica dos modelos.
 * Vem depois dos RPs: a pós-preventiva aponta para o RP pelo nº da ordem.
 * @example await seedKnowledge({ services, ids, today })
 */
export async function seedKnowledge(context: KnowledgeContext): Promise<void> {
  for (const item of DEMO_POST_PREVENTIVES) await seedPostPreventive(context, item);
  for (const card of DEMO_TECH_CARDS) await seedTechCard(context, card);
}

async function seedPostPreventive({ services, ids, today }: KnowledgeContext, item: DemoPostPreventive): Promise<void> {
  const model = demoMachineModel(demoCatalog(), item.machine);
  await services.postPreventives.create({
    preventiveDate: demoDay(today, item.preventiveDaysAgo),
    occurrenceDate: demoDay(today, item.occurrenceDaysAgo),
    machineId: ids.get("machine", item.machine),
    subassemblyId: ids.get("subassembly", `${model}|${item.subassembly}`),
    memberIds: item.members.map((member) => ids.get("person", member)),
    done: item.done,
    occurrence: item.occurrence,
    preventiveAction: item.preventiveAction,
    attentionPoint: item.attentionPoint,
    rpId: ids.optional("rp", item.rpOrder),
  });
}

async function seedTechCard({ services, ids }: KnowledgeContext, card: DemoTechCard): Promise<void> {
  await services.techCards.create({
    type: card.type,
    equipmentId: ids.get("model", card.model),
    subassemblyId: card.subassembly ? ids.get("subassembly", `${card.model}|${card.subassembly}`) : null,
    code: card.code,
    title: card.title,
    summary: card.summary,
    details: card.details,
    tags: card.tags,
  });
}
