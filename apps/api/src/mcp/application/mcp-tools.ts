import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CHAMADO_SHIFTS,
  DUE_WINDOWS,
  FEEDBACK_TONES,
  GESTOR_TIME_ZONE,
  RECORD_PRIORITIES,
  RECORD_STATUSES,
  RECORD_TYPES,
  RP_STATUSES,
} from "@manutencao/shared";
import * as z from "zod";
import { DomainError } from "../../kernel/domain-error";
import { parseRecordList } from "../../registro/application/parse-record-list";
import { matches, overlay } from "../domain/merge";
import { registerDocTools } from "./mcp-doc-tools";
import { answer, CHANGE, CREATE, id, optionalText, READ, toolWriter, type ToolLog } from "./mcp-tool-kit";
import type { McpUseCases } from "./mcp-use-cases";

export const MCP_INSTRUCTIONS = `Sistema do gestor de manutenção de uma fábrica (linhas de produção, máquinas, técnicos).
- Antes de lançar, resolva nomes em ids com buscar_cadastro. Nunca invente id.
- Datas e horas em ISO 8601 no fuso de Brasília (ex.: 2026-10-11T14:30:00-03:00). Dia sozinho: AAAA-MM-DD. resumo_do_dia diz a data de hoje.
- Chamado: atendimento do turno (o que parou, quem atendeu). O que ficar para depois vira pendência com gerar_pendencia.
- Registro: tarefa (task, a pendência com prazo), feedback sobre um técnico ou problema (problem). Situação: open = aberto, in_progress = em andamento, done = concluído.
- RP (Relatório Padrão): análise de falha que chega pelo WhatsApp. Use ler_rp para transformar o texto em campos, mostre ao gestor e só depois salvar_rp.
- Pós-preventiva: ocorrência que apareceu depois de uma preventiva, com o ponto de atenção para a próxima.
- Antes de qualquer ferramenta que grava, mostre ao gestor o que vai gravar.
- Documentação técnica: fichas curtas tiradas dos manuais (código de erro, interface entre máquinas, sinal, peça, parâmetro, procedimento), cada uma com a fonte. Antes de responder sobre um alarme, uma peça ou a ligação entre máquinas, use buscar_documentacao. Ao ler um PDF enviado pelo gestor, crie uma ficha por fato com criar_ficha, citando documentId (listar_documentos) e página ou folha; marque reviewNeeded quando a leitura ficou em dúvida.
- Não há ferramenta de excluir: exclusão é feita na tela.`;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

const day = (what: string) => z.string().regex(DAY, "Use AAAA-MM-DD.").describe(what);
const dateTime = (what: string) => z.string().min(1).describe(`${what}, ISO 8601 com fuso (ex.: 2026-10-11T14:30:00-03:00)`);

const CADASTRO_KINDS = ["fabricas", "linhas", "maquinas", "subconjuntos", "colaboradores", "equipes"] as const;
const SEARCH_LIMIT = 100;

function today(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function list(values: readonly string[] | undefined): string | undefined {
  return values?.length ? values.join(",") : undefined;
}

const cause = z.object({ marked: z.boolean().describe("marcado no 4M"), text: z.string().nullable().optional() });

const rpFields = {
  occurredAt: z.string().min(1).describe("dia do relatório, AAAA-MM-DD"),
  factoryId: id("da fábrica"),
  problem: z.string().min(1).describe("problema, em uma linha"),
  status: z.enum(RP_STATUSES).describe("analysis = em análise, monitoring = em acompanhamento, corrected = corrigido, producing = produzindo"),
  orderNumber: optionalText("número da ordem (OS)"),
  lineId: id("da linha").nullable().optional(),
  line: optionalText("linha como veio no texto, quando não está no cadastro"),
  tag: optionalText("TAG da máquina"),
  machineId: id("da máquina (tem de ser da linha escolhida)").nullable().optional(),
  subassemblyId: id("do subconjunto (tem de ser da máquina: do modelo, da versão dela ou só dela, e não desmarcado nela)").nullable().optional(),
  description: optionalText("descrição da falha"),
  repeatedFailure: z.boolean().optional().describe("falha repetida"),
  repeatedTimes: optionalText("quantas vezes repetiu"),
  repeatedPeriod: optionalText("em que período repetiu"),
  causes: z
    .object({ material: cause.optional(), machine: cause.optional(), method: cause.optional(), labor: cause.optional() })
    .optional()
    .describe("4M: material, machine (máquina), method (método), labor (mão de obra)"),
  rootCause: optionalText("causa raiz"),
  corrective: optionalText("ação corretiva"),
  preventive: optionalText("ação preventiva"),
  basicConditionImpact: optionalText("impacto na condição básica"),
  memberIds: z.array(z.string()).optional().describe("ids dos técnicos"),
  unmatchedTechnicians: optionalText("técnicos do texto que não estão no cadastro"),
  rawText: z.string().optional().describe("texto original do WhatsApp, quando veio de ler_rp"),
};

const chamadoFields = {
  body: z.string().min(1).describe("o que aconteceu"),
  openedAt: dateTime("hora de abertura"),
  closedAt: dateTime("hora de fechamento").nullable().optional(),
  status: z.enum(RECORD_STATUSES).describe("open = aberto, in_progress = em andamento, done = concluído"),
  shift: z.enum(CHAMADO_SHIFTS).nullable().optional().describe("first = 1º turno, second = 2º, third = 3º"),
  memberIds: z.array(z.string()).optional().describe("ids dos técnicos que atenderam"),
  lineId: id("da linha").nullable().optional(),
  lineLabel: optionalText("linha em texto, quando não está no cadastro"),
  machineId: id("da máquina (tem de ser da linha escolhida)").nullable().optional(),
  notes: optionalText("observações"),
};

export function registerTools(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  const write = toolWriter(log);
  registerDocTools(server, uc, log);

  // ---- Consultas ----

  server.registerTool(
    "resumo_do_dia",
    {
      title: "Resumo do dia",
      description: "Data de hoje, contagem de pendências abertas, atrasadas, vencendo hoje e concluídas, últimos registros e ranking de pendências abertas por linha e por colaborador.",
      annotations: READ,
    },
    () => answer(async () => ({ hoje: today(), ...(await uc.dashboard.execute()) })),
  );

  server.registerTool(
    "buscar_cadastro",
    {
      title: "Buscar no cadastro",
      description: "Acha fábricas, linhas, máquinas, subconjuntos, colaboradores e equipes pelo nome (ou TAG da máquina), sem ligar para acento. Devolve os ids que as outras ferramentas pedem.",
      inputSchema: {
        tipo: z.enum(CADASTRO_KINDS).optional().describe("o que procurar; sem tipo, procura em tudo"),
        busca: z.string().optional().describe("parte do nome; vazio lista tudo"),
      },
      annotations: READ,
    },
    ({ tipo, busca }) =>
      answer(async () => {
        const wants = (kind: (typeof CADASTRO_KINDS)[number]) => !tipo || tipo === kind;
        const result: Record<string, unknown[]> = {};
        const cap = <T>(rows: T[]) => rows.slice(0, SEARCH_LIMIT);
        const [factories, lines, machines, subassemblies, members, teams] = await Promise.all([
          wants("fabricas") || wants("linhas") ? uc.factories.list() : [],
          wants("linhas") || wants("maquinas") ? uc.lines.list() : [],
          wants("maquinas") ? uc.machines.list() : [],
          wants("subconjuntos") ? uc.subassemblies.list() : [],
          wants("colaboradores") ? uc.members.list() : [],
          wants("equipes") ? uc.teams.list() : [],
        ]);
        const factoryName = new Map(factories.map((row) => [row.id, row.name]));
        const lineName = new Map(lines.map((row) => [row.id, row.name]));
        if (wants("fabricas")) result.fabricas = cap(factories.filter((row) => matches(busca, row.name)));
        if (wants("linhas")) {
          result.linhas = cap(
            lines
              .filter((row) => matches(busca, row.name, row.internalCode))
              .map((row) => ({ id: row.id, name: row.name, factoryId: row.factoryId, factory: factoryName.get(row.factoryId) ?? null, status: row.status, isCritical: row.isCritical })),
          );
        }
        if (wants("maquinas")) {
          result.maquinas = cap(
            machines
              .filter((row) => matches(busca, row.name, row.tag))
              .map((row) => ({ id: row.id, name: row.name, tag: row.tag, lineId: row.lineId, line: lineName.get(row.lineId) ?? null, equipmentId: row.equipmentId, status: row.status })),
          );
        }
        if (wants("subconjuntos")) {
          result.subconjuntos = cap(subassemblies.filter((row) => !row.archived && matches(busca, row.name)));
        }
        if (wants("colaboradores")) {
          result.colaboradores = cap(
            members
              .filter((row) => matches(busca, row.name, row.registration))
              .map((row) => ({ id: row.id, name: row.name, position: row.position, team: row.teamName, role: row.roleName, grade: row.gradeName, shift: row.shift, status: row.status })),
          );
        }
        if (wants("equipes")) {
          result.equipes = cap(
            teams
              .filter((row) => matches(busca, row.name))
              .map((row) => ({ id: row.id, name: row.name, supervisor: row.supervisorName, memberIds: row.memberIds })),
          );
        }
        return result;
      }),
  );

  server.registerTool(
    "listar_chamados",
    {
      title: "Listar chamados",
      description: "Chamados do turno de um dia (padrão: hoje) ou os mais recentes de uma linha.",
      inputSchema: {
        day: day("dia, AAAA-MM-DD").optional(),
        lineId: id("da linha").optional(),
        limit: z.number().int().min(1).max(200).optional(),
      },
      annotations: READ,
    },
    ({ day: dayValue, lineId, limit }) =>
      answer(() =>
        uc.chamados.list({
          day: dayValue ?? (lineId ? undefined : today()),
          lineId,
          limit: limit === undefined ? undefined : String(limit),
        }),
      ),
  );

  server.registerTool(
    "ver_chamado",
    { title: "Ver chamado", description: "Chamado completo, com técnicos, pendências geradas e RP ligado.", inputSchema: { id: id("do chamado") }, annotations: READ },
    ({ id: chamadoId }) => answer(() => uc.chamados.get(chamadoId)),
  );

  server.registerTool(
    "listar_pendencias",
    {
      title: "Listar registros e pendências",
      description: "Registros (tarefas, feedbacks, problemas) com filtros. Para pendências em aberto: type [task], status [open, in_progress]. Paginado: passe nextCursor em cursor para a próxima página.",
      inputSchema: {
        type: z.array(z.enum(RECORD_TYPES)).optional().describe("task = tarefa, feedback, problem = problema"),
        status: z.array(z.enum(RECORD_STATUSES)).optional(),
        due: z.enum(DUE_WINDOWS).optional().describe("overdue = atrasadas, today = vencem hoje, tomorrow = vencem amanhã"),
        lineIds: z.array(z.string()).optional(),
        memberId: id("do colaborador").optional(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: READ,
    },
    (args) =>
      answer(() =>
        uc.recordsList.page(
          parseRecordList({
            type: list(args.type),
            status: list(args.status),
            due: args.due,
            lineIds: list(args.lineIds),
            memberId: args.memberId,
            cursor: args.cursor,
            limit: args.limit === undefined ? undefined : String(args.limit),
          }),
        ),
      ),
  );

  server.registerTool(
    "ver_registro",
    { title: "Ver registro", description: "Registro completo (tarefa, feedback ou problema).", inputSchema: { id: id("do registro") }, annotations: READ },
    ({ id: recordId }) => answer(() => uc.records.get(recordId)),
  );

  server.registerTool(
    "listar_rps",
    {
      title: "Listar RPs",
      description: "Relatórios Padrão com filtros. Paginado: passe nextCursor em cursor para a próxima página.",
      inputSchema: {
        from: day("a partir do dia").optional(),
        to: day("até o dia").optional(),
        factoryId: id("da fábrica").optional(),
        lineId: id("da linha").optional(),
        tag: z.string().optional(),
        status: z.array(z.enum(RP_STATUSES)).optional(),
        memberId: id("do técnico").optional(),
        repeated: z.boolean().optional().describe("só falhas repetidas (true) ou só não repetidas (false)"),
        q: z.string().optional().describe("texto livre"),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: READ,
    },
    (args) =>
      answer(() =>
        uc.rps.page({
          ...args,
          status: list(args.status),
          repeated: args.repeated === undefined ? undefined : String(args.repeated),
          limit: args.limit === undefined ? undefined : String(args.limit),
        }),
      ),
  );

  server.registerTool(
    "ver_rp",
    { title: "Ver RP", description: "RP completo, com 4M, causa raiz e ações.", inputSchema: { id: id("do RP") }, annotations: READ },
    ({ id: rpId }) => answer(() => uc.rps.get(rpId)),
  );

  server.registerTool(
    "ficha_colaborador",
    {
      title: "Ficha do colaborador",
      description: "Tudo de uma pessoa: cadastro, matriz de competências, avaliação de desempenho do ano, PDI, comportamento, RPs e resumo de registros.",
      inputSchema: {
        memberId: id("do colaborador"),
        year: z.number().int().min(2000).max(2100).optional().describe("ano da avaliação de desempenho; padrão: o atual"),
      },
      annotations: READ,
    },
    ({ memberId, year }) =>
      answer(async () => {
        const member = (await uc.members.list()).find((row) => row.id === memberId);
        if (!member) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
        const [matrix, performance, pdi, pdiItems, behavior, rps, records] = await Promise.all([
          uc.memberMatrix.show(memberId),
          uc.performance.show(memberId, year === undefined ? undefined : String(year)),
          uc.pdi.show(memberId),
          uc.pdiItems.list(memberId),
          uc.behavior.show(memberId),
          uc.rps.memberSummary(memberId),
          uc.recordsList.memberSummary(memberId),
        ]);
        return { member, matrix, performance, pdi, pdiItems, behavior, rps, records };
      }),
  );

  server.registerTool(
    "matriz_da_equipe",
    { title: "Matriz da equipe", description: "Matriz de competências de todos os técnicos, por equipamento, contra o esperado.", annotations: READ },
    () => answer(() => uc.teamMatrix.show()),
  );

  server.registerTool(
    "listar_pos_preventivas",
    {
      title: "Listar pós-preventivas",
      description: "Ocorrências depois de preventiva, com filtros.",
      inputSchema: {
        lineId: id("da linha").optional(),
        machineId: id("da máquina").optional(),
        subassemblyId: id("do subconjunto").optional(),
        memberId: id("do técnico").optional(),
        rpId: id("do RP").optional(),
        activeOnly: z.boolean().optional().describe("só com ponto de atenção ativo"),
        from: day("preventiva a partir do dia").optional(),
        to: day("preventiva até o dia").optional(),
      },
      annotations: READ,
    },
    ({ activeOnly, ...rest }) => answer(() => uc.postPreventives.list({ ...rest, active: activeOnly ? "true" : undefined })),
  );

  server.registerTool(
    "ver_pos_preventiva",
    { title: "Ver pós-preventiva", description: "Ficha de pós-preventiva completa.", inputSchema: { id: id("da ficha") }, annotations: READ },
    ({ id: fichaId }) => answer(() => uc.postPreventives.get(fichaId)),
  );

  server.registerTool(
    "ler_rp",
    {
      title: "Ler RP do WhatsApp",
      description: "Transforma o texto do RP colado do WhatsApp em campos, já casando linha, fábrica e técnicos com o cadastro. Não grava nada; confira os avisos e use salvar_rp depois.",
      inputSchema: { text: z.string().min(1).describe("texto do RP como veio no WhatsApp; pode ter mais de um") },
      annotations: READ,
    },
    ({ text }) => answer(() => uc.rps.parse({ text })),
  );

  // ---- Lançamentos ----

  server.registerTool(
    "salvar_rp",
    {
      title: "Salvar RP",
      description: "Grava um RP (e o problema espelho em Registros). Confere antes se há RP parecido: se houver, não grava e devolve os parecidos; repita com confirmDuplicate true se o gestor confirmar que é outro.",
      inputSchema: {
        ...rpFields,
        chamadoId: id("do chamado que originou o RP").optional(),
        confirmDuplicate: z.boolean().optional().describe("grava mesmo havendo RP parecido"),
      },
      annotations: CREATE,
    },
    write("salvar_rp", async ({ confirmDuplicate, ...fields }) => {
      if (!confirmDuplicate) {
        const duplicates = await uc.rps.checkDuplicate(fields);
        if (duplicates.length) return { saved: false, message: "Há RP parecido. Confirme com o gestor antes de gravar.", duplicates };
      }
      return { saved: true, rp: await uc.rps.create(fields) };
    }),
  );

  server.registerTool(
    "abrir_chamado",
    { title: "Abrir chamado", description: "Abre um chamado no turno. O número do dia é automático.", inputSchema: chamadoFields, annotations: CREATE },
    write("abrir_chamado", (fields) => uc.chamados.open(fields)),
  );

  server.registerTool(
    "editar_chamado",
    {
      title: "Editar chamado",
      description: "Muda um chamado: mande só os campos que mudam (null limpa). Para fechar: status done e closedAt.",
      inputSchema: {
        id: id("do chamado"),
        ...Object.fromEntries(Object.entries(chamadoFields).map(([key, schema]) => [key, schema.optional()])),
      } as { id: z.ZodString } & { [K in keyof typeof chamadoFields]: z.ZodOptional<(typeof chamadoFields)[K]> },
      annotations: CHANGE,
    },
    write("editar_chamado", async ({ id: chamadoId, ...changes }) => {
      const current = await uc.chamados.get(chamadoId);
      const body = overlay(
        {
          body: current.body,
          openedAt: current.openedAt ?? current.occurredAt,
          closedAt: current.closedAt,
          shift: current.shift,
          memberIds: current.memberIds,
          lineId: current.lineId,
          lineLabel: current.lineLabel,
          machineId: current.machineId,
          status: current.status,
          notes: current.notes,
        },
        changes,
      );
      return uc.chamados.edit(chamadoId, body);
    }),
  );

  server.registerTool(
    "gerar_pendencia",
    {
      title: "Gerar pendência de um chamado",
      description: "Cria uma tarefa com prazo ligada a um chamado (o que ficou para depois).",
      inputSchema: {
        chamadoId: id("do chamado"),
        body: z.string().min(1).describe("o que falta fazer"),
        dueAt: dateTime("prazo"),
        memberId: id("do responsável").nullable().optional(),
        priority: z.enum(RECORD_PRIORITIES).nullable().optional().describe("low = baixa, medium = média, high = alta"),
      },
      annotations: CREATE,
    },
    write("gerar_pendencia", ({ chamadoId, ...task }) => uc.chamados.addTask(chamadoId, task)),
  );

  server.registerTool(
    "registrar",
    {
      title: "Registrar",
      description: "Anota um registro novo: rascunho da Entrada (entry, para o coordenador classificar depois), tarefa (task), feedback sobre um técnico ou problema (problem). Para prazo, prioridade e outros detalhes, use atualizar_registro em seguida.",
      inputSchema: {
        type: z.enum(RECORD_TYPES).describe("entry = rascunho da Entrada, task = tarefa, feedback, problem = problema"),
        body: z.string().min(1).describe("texto do registro"),
        occurredAt: dateTime("quando aconteceu"),
        memberId: id("do colaborador").nullable().optional(),
        tone: z.enum(FEEDBACK_TONES).nullable().optional().describe("só feedback: positive, negative, neutral"),
      },
      annotations: CREATE,
    },
    write("registrar", (fields) => uc.records.capture(fields)),
  );

  server.registerTool(
    "atualizar_registro",
    {
      title: "Atualizar registro",
      description: "Muda um registro: mande só os campos que mudam (null limpa). Tarefa aceita status, responsável, prazo, prioridade, fábrica, linha, TAG e observações; feedback aceita tom e observações; problema aceita linha, máquina, subconjunto e observações. Problema que veio de chamado ou RP muda por lá.",
      inputSchema: {
        id: id("do registro"),
        type: z.enum(RECORD_TYPES).optional().describe("troca o tipo (só registro da Entrada, sem anexo e que não veio de chamado)"),
        body: z.string().min(1).optional(),
        occurredAt: dateTime("quando aconteceu").optional(),
        status: z.enum(RECORD_STATUSES).optional().describe("tarefa: open, in_progress, done"),
        memberId: id("do colaborador").nullable().optional(),
        dueAt: dateTime("prazo").nullable().optional(),
        priority: z.enum(RECORD_PRIORITIES).nullable().optional(),
        factoryId: id("da fábrica").nullable().optional(),
        line: optionalText("tarefa: linha em texto"),
        tag: optionalText("tarefa: TAG"),
        lineId: id("da linha (problema)").nullable().optional(),
        lineLabel: optionalText("problema: linha em texto"),
        machineId: id("da máquina (problema; tem de ser da linha)").nullable().optional(),
        subassemblyId: id("do subconjunto (problema; tem de ser da máquina: do modelo, da versão dela ou só dela)").nullable().optional(),
        tone: z.enum(FEEDBACK_TONES).nullable().optional(),
        notes: optionalText("observações"),
      },
      annotations: CHANGE,
    },
    write("atualizar_registro", async ({ id: recordId, ...changes }) => {
      const current = await uc.records.get(recordId);
      const body = overlay(
        {
          body: current.body,
          occurredAt: current.occurredAt,
          status: current.status,
          memberId: current.memberId,
          dueAt: current.dueAt,
          priority: current.priority,
          factoryId: current.factoryId,
          line: current.line,
          tag: current.tag,
          lineId: current.lineId,
          lineLabel: current.lineLabel,
          machineId: current.machineId,
          subassemblyId: current.subassemblyId,
          tone: current.tone,
          notes: current.notes,
        },
        changes,
      );
      return uc.records.updateSheet(recordId, body);
    }),
  );

  server.registerTool(
    "lancar_pos_preventiva",
    {
      title: "Lançar pós-preventiva",
      description: "Registra uma ocorrência que apareceu depois de uma preventiva. O subconjunto tem de ser da máquina: mesmo equipmentId, versionId vazio ou igual ao da máquina, machineId vazio ou igual ao id da máquina, e fora de hiddenSubassemblyIds da máquina (veja buscar_cadastro).",
      inputSchema: {
        preventiveDate: day("dia da preventiva"),
        occurrenceDate: day("dia da ocorrência").nullable().optional(),
        machineId: id("da máquina"),
        subassemblyId: id("do subconjunto"),
        memberIds: z.array(z.string()).min(1).describe("ids dos técnicos da preventiva"),
        done: z.string().min(1).describe("o que foi feito na preventiva"),
        occurrence: z.string().min(1).describe("a ocorrência"),
        preventiveAction: z.string().min(1).describe("ação para não repetir"),
        attentionPoint: z.string().min(1).describe("ponto de atenção para a próxima preventiva"),
        attentionActive: z.boolean().optional().describe("ponto vai para a folha do técnico (padrão: sim)"),
        rpId: id("do RP ligado").nullable().optional(),
      },
      annotations: CREATE,
    },
    write("lancar_pos_preventiva", (fields) => uc.postPreventives.create(fields)),
  );
}
