import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MACHINE_STATUS_LABELS, MACHINE_STATUSES, type SubassemblyDto } from "@manutencao/shared";
import * as z from "zod";
import { DomainError } from "../../kernel/domain-error";
import { overlay } from "../domain/merge";
import { CADASTRO_REMOVABLE_KINDS, removeFromCadastro } from "./mcp-cadastro-removal";
import { CHANGE, CREATE, id, optionalText, toolWriter, type ToolLog } from "./mcp-tool-kit";
import type { McpUseCases } from "./mcp-use-cases";

// Ferramentas do cadastro de equipamentos: fábrica, máquina, modelo de equipamento e subconjunto.
// Criar e editar chamam os casos de uso da tela; excluir passa por mcp-cadastro-removal.ts.

const MAX_NEW_SUBASSEMBLIES = 50;

const statusHelp = Object.entries(MACHINE_STATUS_LABELS).map(([value, label]) => `${value} = ${label}`).join(", ");
const name = (what: string) => z.string().trim().min(1).describe(what);
const modelId = (what: string) => id(`do modelo de equipamento${what} (buscar_cadastro tipo modelos)`);
const minQualified = z.number().int().min(0).max(99).describe("quantos técnicos qualificados o modelo precisa ter na matriz; 0 = sem mínimo");

const machineFields = {
  lineId: id("da linha"),
  name: name("nome da máquina (ex.: Encartuchadeira)"),
  equipmentId: modelId(", a versão da máquina (ex.: Equipamento A); null tira o modelo").nullable().optional(),
  tag: optionalText("TAG da máquina"),
  manufacturer: optionalText("fabricante"),
  status: z.enum(MACHINE_STATUSES).describe(statusHelp),
  notes: optionalText("observações"),
};

export function registerCadastroTools(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  registerFactoryTools(server, uc, log);
  registerMachineTools(server, uc, log);
  registerModelTools(server, uc, log);
  registerSubassemblyTools(server, uc, log);
  registerRemoval(server, uc, log);
}

function registerFactoryTools(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  const write = toolWriter(log);
  server.registerTool(
    "criar_fabrica",
    { title: "Criar fábrica", description: "Cadastra uma fábrica (unidade). As linhas da fábrica são cadastradas na tela.", inputSchema: { name: name("nome da fábrica") }, annotations: CREATE },
    write("criar_fabrica", (fields) => uc.factories.create(fields)),
  );
  server.registerTool(
    "editar_fabrica",
    { title: "Renomear fábrica", description: "Troca o nome de uma fábrica.", inputSchema: { id: id("da fábrica"), name: name("nome novo") }, annotations: CHANGE },
    write("editar_fabrica", ({ id: factoryId, ...fields }) => uc.factories.rename(factoryId, fields)),
  );
}

function registerMachineTools(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  const write = toolWriter(log);
  server.registerTool(
    "criar_maquina",
    { title: "Criar máquina", description: "Cadastra uma máquina (equipamento) numa linha, com o modelo dela quando já existe.", inputSchema: machineFields, annotations: CREATE },
    write("criar_maquina", (fields) => uc.machines.create(fields)),
  );
  server.registerTool(
    "editar_maquina",
    {
      title: "Editar máquina",
      description: "Muda uma máquina: mande só os campos que mudam; null limpa. O modelo não muda se a máquina tem ficha pós-preventiva ou subconjunto só dela.",
      inputSchema: { id: id("da máquina"), ...partial(machineFields) },
      annotations: CHANGE,
    },
    write("editar_maquina", async ({ id: machineId, ...changes }) => {
      const current = (await uc.machines.list()).find((row) => row.id === machineId);
      if (!current) throw new DomainError("not_found", 404, `Máquina não encontrada: ${machineId}. Use os ids de buscar_cadastro.`);
      const { lineId, equipmentId, name: machineName, tag, manufacturer, status, notes } = current;
      return uc.machines.update(machineId, overlay({ lineId, equipmentId, name: machineName, tag, manufacturer, status, notes }, changes));
    }),
  );
}

function registerModelTools(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  const write = toolWriter(log);
  server.registerTool(
    "criar_modelo",
    {
      title: "Criar modelo de equipamento",
      description: "Cadastra um modelo de equipamento: a versão da máquina (ex.: Equipamento A). É o mesmo equipamento da matriz de competências; o nome não se repete.",
      inputSchema: { name: name("nome do modelo"), minQualified: minQualified.optional() },
      annotations: CREATE,
    },
    write("criar_modelo", async ({ name: modelName, minQualified: minimum }) => {
      const created = await uc.matrixCatalog.createEquipment({ name: modelName });
      return minimum ? uc.matrixCatalog.updateEquipment(created.id, { ...created, minQualified: minimum }) : created;
    }),
  );
  server.registerTool(
    "editar_modelo",
    {
      title: "Editar modelo de equipamento",
      description: "Muda um modelo: mande só o que muda. archived true tira o modelo das listas sem apagar nada (é o caminho quando ele está em uso).",
      inputSchema: { id: modelId(""), name: name("nome novo").optional(), archived: z.boolean().optional().describe("true arquiva, false reativa"), minQualified: minQualified.optional() },
      annotations: CHANGE,
    },
    write("editar_modelo", async ({ id: equipmentId, ...changes }) => {
      const current = (await uc.matrixCatalog.show()).equipments.find((row) => row.id === equipmentId);
      if (!current) throw new DomainError("not_found", 404, `Modelo de equipamento não encontrado: ${equipmentId}. Use os ids de buscar_cadastro (tipo modelos).`);
      const { name: modelName, archived, minQualified: minimum } = current;
      return uc.matrixCatalog.updateEquipment(equipmentId, overlay({ name: modelName, archived, minQualified: minimum }, changes));
    }),
  );
}

function registerSubassemblyTools(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  const write = toolWriter(log);
  server.registerTool(
    "criar_subconjuntos",
    {
      title: "Criar subconjuntos",
      description: `Cadastra até ${MAX_NEW_SUBASSEMBLIES} subconjuntos de um modelo. Sem machineId valem para todas as máquinas do modelo; com machineId, só para aquela máquina (que tem de ser do modelo). Nome que já aparece na mesma máquina é pulado e volta em recusados.`,
      inputSchema: {
        equipmentId: modelId(""),
        machineId: id("da máquina, quando o subconjunto é só dela").nullable().optional(),
        names: z.array(name("nome do subconjunto (ex.: Válvulas roletes)")).min(1).max(MAX_NEW_SUBASSEMBLIES),
      },
      annotations: CREATE,
    },
    write("criar_subconjuntos", ({ equipmentId, machineId, names }) => createSubassemblies(uc, equipmentId, machineId ?? null, names)),
  );
  server.registerTool(
    "editar_subconjunto",
    {
      title: "Editar subconjunto",
      description: "Renomeia ou arquiva um subconjunto (o modelo e a máquina dele não mudam). Arquivado sai das listas de escolha, mas o que já aponta para ele fica.",
      inputSchema: { id: id("do subconjunto"), name: name("nome novo").optional(), archived: z.boolean().optional().describe("true arquiva, false reativa") },
      annotations: CHANGE,
    },
    write("editar_subconjunto", async ({ id: subassemblyId, ...changes }) => {
      const current = (await uc.subassemblies.list()).find((row) => row.id === subassemblyId);
      if (!current) throw new DomainError("not_found", 404, `Subconjunto não encontrado: ${subassemblyId}. Use os ids de buscar_cadastro.`);
      return uc.subassemblies.update(subassemblyId, overlay({ name: current.name, archived: current.archived }, changes));
    }),
  );
}

// Nome repetido recusa só aquele; qualquer outro erro (modelo ou máquina errados) para o lote, que falharia igual em todos.
async function createSubassemblies(uc: McpUseCases, equipmentId: string, machineId: string | null, names: readonly string[]) {
  const criados: SubassemblyDto[] = [];
  const recusados: { name: string; motivo: string }[] = [];
  for (const subassemblyName of names) {
    try {
      criados.push(await uc.subassemblies.create({ equipmentId, machineId, name: subassemblyName }));
    } catch (error) {
      if (!(error instanceof DomainError) || error.code !== "subassembly_name_taken") throw error;
      recusados.push({ name: subassemblyName, motivo: error.message });
    }
  }
  return { criados, recusados };
}

function registerRemoval(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  server.registerTool(
    "excluir_do_cadastro",
    {
      title: "Excluir do cadastro",
      description:
        "Exclui uma fábrica, máquina, modelo de equipamento ou subconjunto. Chame antes com conferir true, mostre ao gestor o resultado (o que impede ou o que vai junto) e só exclua depois do ok do gestor. Recusa quando há algo ligado: linhas na fábrica, fichas, habilidades, técnicos, ou registros e RPs que perderiam a ligação. Modelo e subconjunto em uso se arquivam com editar_modelo e editar_subconjunto. A exclusão não se desfaz.",
      inputSchema: {
        tipo: z.enum(CADASTRO_REMOVABLE_KINDS).describe("o que excluir"),
        id: id("do item"),
        conferir: z.boolean().optional().describe("true só confere se dá para excluir, sem excluir"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    toolWriter(log)("excluir_do_cadastro", ({ tipo, id: itemId, conferir }) => removeFromCadastro(uc, tipo, itemId, conferir === true)),
  );
}

// Na edição tudo é opcional: o que não vier fica como está.
function partial<T extends Record<string, z.ZodTypeAny>>(fields: T): { [K in keyof T]: z.ZodOptional<T[K]> } {
  return Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()])) as { [K in keyof T]: z.ZodOptional<T[K]> };
}
