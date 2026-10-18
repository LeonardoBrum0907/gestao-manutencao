import { DomainError } from "../../kernel/domain-error";
import { removalCheck } from "../../kernel/removal";
import { assertNothingLinked, NO_CADASTRO_LINKS, type CadastroLinks } from "../domain/cadastro-removal";
import type { McpUseCases } from "./mcp-use-cases";

// Exclusão de fábrica, máquina, modelo e subconjunto pela IA: as regras da tela (o checkRemoval de cada caso de uso)
// e, por cima, a recusa quando algum lançamento perderia a ligação.

export const CADASTRO_REMOVABLE_KINDS = ["fabrica", "maquina", "modelo", "subconjunto"] as const;
export type CadastroRemovableKind = (typeof CADASTRO_REMOVABLE_KINDS)[number];

type RemovalTarget = {
  label: string;
  links: CadastroLinks;
  // O que sugerir quando há lançamento ligado.
  alternative?: string;
  // O que o banco apaga junto: os subconjuntos só daquela máquina.
  goesAlong: string[];
  check: () => Promise<void>;
  remove: () => Promise<void>;
};

const notFound = (what: string, id: string, source: string) =>
  new DomainError("not_found", 404, `${what}: ${id}. Use os ids de ${source}.`);

async function factoryTarget(uc: McpUseCases, id: string): Promise<RemovalTarget> {
  const factory = (await uc.factories.list()).find((row) => row.id === id);
  if (!factory) throw notFound("Fábrica não encontrada", id, "buscar_cadastro");
  const links = await uc.cadastroLinks.ofFactory(id);
  return { label: `a fábrica ${factory.name}`, links, goesAlong: [], check: () => uc.factories.checkRemoval(id), remove: () => uc.factories.remove(id) };
}

async function machineTarget(uc: McpUseCases, id: string): Promise<RemovalTarget> {
  const [machines, subassemblies] = await Promise.all([uc.machines.list(), uc.subassemblies.list()]);
  const machine = machines.find((row) => row.id === id);
  if (!machine) throw notFound("Máquina não encontrada", id, "buscar_cadastro");
  const goesAlong = subassemblies.filter((row) => row.machineId === id).map((row) => `subconjunto ${row.name}`);
  const links = await uc.cadastroLinks.ofMachine(id);
  return { label: `a máquina ${machine.name}`, links, goesAlong, check: () => uc.machines.checkRemoval(id), remove: () => uc.machines.remove(id) };
}

// O modelo já tem trava completa no caso de uso (máquinas, habilidades, técnicos, subconjuntos, documentação).
async function modelTarget(uc: McpUseCases, id: string): Promise<RemovalTarget> {
  const model = (await uc.matrixCatalog.show()).equipments.find((row) => row.id === id);
  if (!model) throw notFound("Modelo de equipamento não encontrado", id, "buscar_cadastro (tipo modelos)");
  const catalog = uc.matrixCatalog;
  return { label: `o modelo ${model.name}`, links: NO_CADASTRO_LINKS, goesAlong: [], check: () => catalog.checkEquipmentRemoval(id), remove: () => catalog.removeEquipment(id) };
}

async function subassemblyTarget(uc: McpUseCases, id: string): Promise<RemovalTarget> {
  const subassembly = (await uc.subassemblies.list()).find((row) => row.id === id);
  if (!subassembly) throw notFound("Subconjunto não encontrado", id, "buscar_cadastro");
  const links = await uc.cadastroLinks.ofSubassembly(id);
  const alternative = "Arquive com editar_subconjunto, ou exclua pela tela se o gestor quiser mesmo.";
  return { label: `o subconjunto ${subassembly.name}`, links, alternative, goesAlong: [], check: () => uc.subassemblies.checkRemoval(id), remove: () => uc.subassemblies.remove(id) };
}

const TARGETS: Record<CadastroRemovableKind, (uc: McpUseCases, id: string) => Promise<RemovalTarget>> = {
  fabrica: factoryTarget,
  maquina: machineTarget,
  modelo: modelTarget,
  subconjunto: subassemblyTarget,
};

/**
 * Confere (onlyCheck) ou exclui um item do cadastro. Recusa com o motivo quando a tela recusaria ou quando há lançamento ligado.
 * @example await removeFromCadastro(uc, "maquina", "m1", true) // { item, podeExcluir, motivo, vaiJunto }
 */
export async function removeFromCadastro(uc: McpUseCases, kind: CadastroRemovableKind, id: string, onlyCheck: boolean) {
  const target = await TARGETS[kind](uc, id);
  const verdict = await removalCheck(async () => {
    assertNothingLinked(target.label, target.links, target.alternative);
    await target.check();
  });
  if (onlyCheck) return { item: target.label, podeExcluir: verdict.canRemove, motivo: verdict.reason, vaiJunto: target.goesAlong };
  if (!verdict.canRemove) throw new DomainError("cadastro_in_use", 409, verdict.reason ?? `Não dá para excluir ${target.label}.`);
  await target.remove();
  return { excluido: target.label, foiJunto: target.goesAlong };
}
