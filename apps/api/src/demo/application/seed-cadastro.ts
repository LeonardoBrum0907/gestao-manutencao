import type { DemoCatalog, DemoLine, DemoModel } from "../domain/demo-catalog";
import type { DemoIds, DemoServices } from "./demo-services";

/**
 * Fábricas, modelos (com subconjuntos e habilidades), linhas e máquinas, pelas regras do cadastro.
 * Grava em `ids`: factory, model, subassembly ("a|Subconjunto 1 · Alimentação"), skill ("a|0"), line e machine.
 * @example await seedCadastro(services, demoCatalog(), ids)
 */
export async function seedCadastro(services: DemoServices, catalog: DemoCatalog, ids: DemoIds): Promise<void> {
  for (const factory of catalog.factories) {
    ids.set("factory", factory.key, (await services.factories.create({ name: factory.name })).id);
  }
  for (const model of catalog.models) await seedModel(services, model, ids);
  for (const line of catalog.lines) await seedLine(services, line, ids);
}

async function seedModel(services: DemoServices, model: DemoModel, ids: DemoIds): Promise<void> {
  const { id } = await services.matrixCatalog.createEquipment({ name: model.name });
  await services.matrixCatalog.updateEquipment(id, { name: model.name, archived: false, minQualified: model.minQualified });
  ids.set("model", model.key, id);
  for (const name of model.subassemblies) {
    ids.set("subassembly", `${model.key}|${name}`, (await services.subassemblies.create({ equipmentId: id, name })).id);
  }
  for (const [index, skill] of model.skills.entries()) {
    ids.set("skill", `${model.key}|${index}`, (await services.matrixCatalog.createSkill({ equipmentId: id, ...skill })).id);
  }
}

async function seedLine(services: DemoServices, line: DemoLine, ids: DemoIds): Promise<void> {
  const factoryId = ids.get("factory", line.factory);
  const { id } = await services.lines.create({ name: line.name, factoryId, status: "released", isDailyLine: line.isDailyLine, isCritical: line.isCritical });
  ids.set("line", line.key, id);
  for (const machine of line.machines) {
    const equipmentId = ids.get("model", machine.model);
    const created = await services.machines.create({ lineId: id, equipmentId, name: machine.name, tag: machine.tag, status: "released" });
    ids.set("machine", machine.key, created.id);
  }
}
