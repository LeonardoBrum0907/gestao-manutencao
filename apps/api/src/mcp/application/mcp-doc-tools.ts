import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TECH_CARD_DETAIL_FIELDS, TECH_CARD_TYPES, TECH_DOCUMENT_KINDS, type TechCardHit } from "@manutencao/shared";
import * as z from "zod";
import { overlay } from "../domain/merge";
import type { McpUseCases } from "./mcp-use-cases";
import { answer, CHANGE, CREATE, id, optionalText, READ, toolWriter, type ToolLog } from "./mcp-tool-kit";

// Ferramentas da documentação técnica: a IA lê um PDF (texto ou imagem das páginas) e cria fichas curtas;
// depois qualquer um pergunta e a busca devolve a ficha com a fonte.

const detailFieldsHelp = TECH_CARD_TYPES.map((type) => `${type}: ${TECH_CARD_DETAIL_FIELDS[type].map((field) => field.key).join(", ")}`).join("; ");

const cardFields = {
  type: z.enum(TECH_CARD_TYPES).describe("error_code = código de erro/alarme, interface = ligação entre máquinas, signal = sinal ou dispositivo (sensor, relé, chave), part = peça, parameter = parâmetro, procedure = procedimento"),
  equipmentId: id("do modelo de equipamento: a ficha vale para todas as máquinas do modelo").nullable().optional(),
  machineId: id("da máquina: a ficha vale só para ela").nullable().optional(),
  lineId: id("da linha: a ficha vale para a linha toda (ex.: interface entre duas máquinas)").nullable().optional(),
  subassemblyId: id("do subconjunto do modelo").nullable().optional(),
  code: optionalText("código do erro, nº da peça, tag do sinal ou nome do parâmetro: o que o técnico digita na busca (obrigatório em error_code e part)"),
  title: z.string().min(1).describe("título curto em português"),
  summary: optionalText("a resposta em uma ou duas frases"),
  details: z.record(z.string(), z.string()).optional().describe(`campos do tipo (${detailFieldsHelp})`),
  deviceTag: optionalText("tag do dispositivo no esquema (ex.: -X1664, -K0921)"),
  originalTerm: optionalText("termo como está no manual, em alemão ou inglês (ex.: Folgemaschine)"),
  tags: z.array(z.string()).optional().describe("etiquetas livres (ex.: Rede, Elétrica)"),
  documentId: id("do documento de onde veio (listar_documentos)").nullable().optional(),
  page: z.number().int().min(1).nullable().optional().describe("página do documento"),
  sheet: optionalText("folha ou coluna do esquema elétrico, quando a página não basta (ex.: 166 / coluna 7)"),
  reviewNeeded: z.boolean().optional().describe("true quando a leitura ficou em dúvida: o coordenador confere antes de confiar"),
};

// O que a IA precisa ver de um acerto, sem as datas e ids repetidos.
function brief(hit: TechCardHit) {
  return {
    id: hit.id,
    type: hit.type,
    exact: hit.exact,
    code: hit.code,
    title: hit.title,
    summary: hit.summary,
    details: hit.details,
    scope: hit.scopeLabel,
    equipmentId: hit.equipmentId,
    machineId: hit.machineId,
    lineId: hit.lineId,
    subassembly: hit.subassemblyName,
    deviceTag: hit.deviceTag,
    originalTerm: hit.originalTerm,
    tags: hit.tags,
    source: hit.documentName ? { documentId: hit.documentId, document: hit.documentName, page: hit.page, sheet: hit.sheet } : null,
    reviewNeeded: hit.reviewNeeded,
  };
}

export function registerDocTools(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  const write = toolWriter(log);

  server.registerTool(
    "buscar_documentacao",
    {
      title: "Buscar na documentação técnica",
      description: "Acha fichas da documentação técnica (código de erro, interface entre máquinas, sinal, peça, parâmetro, procedimento) por código, nº de peça, palavra, tag ou termo em alemão/inglês, sem ligar para acento. Acerto exato vem primeiro. Filtre por máquina, linha ou modelo para ver só o que vale para eles.",
      inputSchema: {
        busca: z.string().optional().describe("o que procurar; vazio lista tudo do filtro"),
        tipo: z.enum(TECH_CARD_TYPES).optional(),
        machineId: id("da máquina").optional(),
        lineId: id("da linha").optional(),
        equipmentId: id("do modelo").optional(),
        subassemblyId: id("do subconjunto").optional(),
        limit: z.number().int().min(1).max(200).optional(),
      },
      annotations: READ,
    },
    ({ busca, tipo, machineId, lineId, equipmentId, subassemblyId, limit }) =>
      answer(async () => {
        const result = await uc.techCards.search({ q: busca, type: tipo, machineId, lineId, equipmentId, subassemblyId, limit: limit?.toString() });
        return { total: result.total, fichas: result.hits.map(brief), posPreventivaIds: result.postPreventiveIds };
      }),
  );

  server.registerTool(
    "listar_documentos",
    {
      title: "Listar documentos técnicos",
      description: "Documentos (PDFs) de um modelo de equipamento, com o id para citar como fonte das fichas e quantas fichas já apontam para cada um.",
      inputSchema: { equipmentId: id("do modelo").optional() },
      annotations: READ,
    },
    ({ equipmentId }) => answer(() => uc.techDocuments.list(equipmentId ?? null)),
  );

  server.registerTool(
    "criar_ficha",
    {
      title: "Criar ficha de documentação",
      description: `Grava uma ficha de conhecimento tirada de um manual: um fato por ficha, com a fonte (documentId e página ou folha). Escolha um alvo só: equipmentId (modelo), machineId ou lineId. Tipos de documento para referência: ${TECH_DOCUMENT_KINDS.join(", ")}.`,
      inputSchema: cardFields,
      annotations: CREATE,
    },
    write("criar_ficha", (fields) => uc.techCards.create(fields)),
  );

  server.registerTool(
    "atualizar_ficha",
    {
      title: "Atualizar ficha de documentação",
      description: "Muda uma ficha: mande só os campos que mudam (null limpa). Use para tirar o reviewNeeded depois que o coordenador conferiu.",
      inputSchema: { id: id("da ficha"), ...Object.fromEntries(Object.entries(cardFields).map(([key, schema]) => [key, schema.optional()])) },
      annotations: CHANGE,
    },
    write("atualizar_ficha", async ({ id: cardId, ...changes }) => {
      const current = await uc.techCards.get(cardId);
      return uc.techCards.update(cardId, overlay({ ...current }, changes));
    }),
  );
}
