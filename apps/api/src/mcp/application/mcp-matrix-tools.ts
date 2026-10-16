import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { COMPETENCY_LEVELS, type MatrixCatalogDto, type MatrixSkillDto } from "@manutencao/shared";
import * as z from "zod";
import { MAX_BULK_ENTRIES } from "../../competencia/application/parse-matrix";
import { DomainError } from "../../kernel/domain-error";
import { canonicalSubgroup, equipmentsToMark, findSameSkill, mergeScore, type ScoreChange } from "../domain/matrix-merge";
import { matches, overlay } from "../domain/merge";
import type { McpUseCases } from "./mcp-use-cases";
import { answer, CHANGE, CREATE, id, READ, toolWriter, type ToolLog } from "./mcp-tool-kit";

// Ferramentas da matriz de competências: catálogo (equipamentos e habilidades) e notas dos técnicos.
// Cada uma chama o mesmo caso de uso da tela; nenhuma exclui (arquivar é pelo editar_habilidade).

const MAX_NEW_SKILLS = 50;

const levelHelp = "basic = básico, intermediate = intermediário, advanced = avançado";
const scoreHelp = "0 sem experiência, 1 básico, 2 intermediário, 3 avançado, 4 referência";

const skillFields = {
  equipmentId: id("do equipamento da matriz (catalogo_da_matriz)"),
  subgroup: z.string().trim().min(1).describe("subconjunto onde a habilidade aparece (ex.: Cabeçote); use um que já existe no equipamento quando couber"),
  text: z.string().trim().min(1).describe("a habilidade, como o técnico lê na matriz"),
  level: z.enum(COMPETENCY_LEVELS).describe(`dificuldade: ${levelHelp}`),
};

const scoreChange = z.object({
  skillId: id("da habilidade (catalogo_da_matriz)"),
  score: z.number().int().min(0).max(4).nullable().optional().describe(`nota: ${scoreHelp}; null apaga`),
  notApplicable: z.boolean().optional().describe("true = não se aplica a este técnico (tira a nota)"),
  expected: z.number().int().min(1).max(4).nullable().optional().describe("esperado só desta linha; null volta ao padrão do grau"),
});

// O que a IA precisa ver de uma habilidade: o nome do equipamento junto, para não ter de cruzar ids.
function describeSkill(skill: MatrixSkillDto, equipmentName: ReadonlyMap<string, string>) {
  return { ...skill, equipment: equipmentName.get(skill.equipmentId) ?? null };
}

function equipmentNames(catalog: MatrixCatalogDto): Map<string, string> {
  return new Map(catalog.equipments.map((equipment) => [equipment.id, equipment.name]));
}

function requireKnownEquipments(catalog: MatrixCatalogDto, equipmentIds: readonly string[]): void {
  const unknown = equipmentIds.filter((equipmentId) => !catalog.equipments.some((equipment) => equipment.id === equipmentId));
  if (unknown.length) throw new DomainError("equipment", 400, `Equipamento não encontrado: ${unknown.join(", ")}. Use os ids de catalogo_da_matriz.`);
}

export function registerMatrixTools(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  registerCatalogQuery(server, uc);
  registerSkillCreation(server, uc, log);
  registerSkillEdit(server, uc, log);
  registerScoring(server, uc, log);
}

function registerCatalogQuery(server: McpServer, uc: McpUseCases): void {
  server.registerTool(
    "catalogo_da_matriz",
    {
      title: "Catálogo da matriz",
      description: "Equipamentos e habilidades da matriz de competências, com ids, subconjunto e dificuldade. Use para achar o skillId antes de dar_nota_matriz e para ler os nomes das habilidades que ficha_colaborador e matriz_da_equipe mostram só por id.",
      inputSchema: {
        equipmentId: id("do equipamento").optional(),
        busca: z.string().optional().describe("parte do texto da habilidade, do subconjunto ou do nome do equipamento"),
        incluirArquivadas: z.boolean().optional().describe("traz também equipamentos e habilidades arquivados"),
      },
      annotations: READ,
    },
    ({ equipmentId, busca, incluirArquivadas }) =>
      answer(async () => {
        const catalog = await uc.matrixCatalog.show();
        const names = equipmentNames(catalog);
        const visible = (archived: boolean) => incluirArquivadas || !archived;
        const habilidades = catalog.skills
          .filter((skill) => visible(skill.archived) && (!equipmentId || skill.equipmentId === equipmentId))
          .filter((skill) => matches(busca, skill.text, skill.subgroup, names.get(skill.equipmentId)))
          .map((skill) => describeSkill(skill, names));
        return { equipamentos: catalog.equipments.filter((equipment) => visible(equipment.archived)), habilidades };
      }),
  );
}

function registerSkillCreation(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  server.registerTool(
    "cadastrar_habilidades",
    {
      title: "Cadastrar habilidades na matriz",
      description: `Cadastra até ${MAX_NEW_SKILLS} habilidades de uma vez, cada uma no fim do seu equipamento. Pula a que já existe com o mesmo texto no mesmo equipamento e subconjunto (devolve em puladas); repita com confirmDuplicate true se o gestor quiser a repetida.`,
      inputSchema: {
        habilidades: z.array(z.object(skillFields)).min(1).max(MAX_NEW_SKILLS),
        confirmDuplicate: z.boolean().optional().describe("cadastra mesmo havendo igual"),
      },
      annotations: CREATE,
    },
    toolWriter(log)("cadastrar_habilidades", async ({ habilidades, confirmDuplicate }) => {
      const catalog = await uc.matrixCatalog.show();
      requireKnownEquipments(catalog, habilidades.map((draft) => draft.equipmentId));
      const names = equipmentNames(catalog);
      const criadas: ReturnType<typeof describeSkill>[] = [];
      const puladas: ReturnType<typeof describeSkill>[] = [];
      for (const draft of habilidades) {
        const known = [...catalog.skills, ...criadas];
        const subgroup = canonicalSubgroup(known, draft.equipmentId, draft.subgroup);
        const same = confirmDuplicate ? undefined : findSameSkill(known, { ...draft, subgroup });
        if (same) puladas.push(describeSkill(same, names));
        else criadas.push(describeSkill(await uc.matrixCatalog.createSkill({ ...draft, subgroup }), names));
      }
      return { criadas, puladas };
    }),
  );
}

function registerSkillEdit(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  server.registerTool(
    "editar_habilidade",
    {
      title: "Editar habilidade da matriz",
      description: "Muda uma habilidade: mande só os campos que mudam. Trocar de equipamento leva para o fim da lista do novo. archived true tira da matriz sem perder as notas (não há ferramenta de excluir).",
      inputSchema: {
        id: id("da habilidade (catalogo_da_matriz)"),
        equipmentId: skillFields.equipmentId.optional(),
        subgroup: skillFields.subgroup.optional(),
        text: skillFields.text.optional(),
        level: skillFields.level.optional(),
        archived: z.boolean().optional().describe("true arquiva, false reativa"),
      },
      annotations: CHANGE,
    },
    toolWriter(log)("editar_habilidade", async ({ id: skillId, ...changes }) => {
      const current = (await uc.matrixCatalog.show()).skills.find((skill) => skill.id === skillId);
      if (!current) throw new DomainError("not_found", 404, `Habilidade não encontrada: ${skillId}. Use os ids de catalogo_da_matriz.`);
      const { equipmentId, subgroup, text, level, archived } = current;
      return uc.matrixCatalog.updateSkill(skillId, overlay({ equipmentId, subgroup, text, level, archived }, changes));
    }),
  );
}

function registerScoring(server: McpServer, uc: McpUseCases, log: ToolLog): void {
  server.registerTool(
    "dar_nota_matriz",
    {
      title: "Dar nota na matriz do colaborador",
      description: `Lança notas de um técnico na matriz de competências (até ${MAX_BULK_ENTRIES} habilidades de uma vez). Mande por habilidade só o que muda: score, notApplicable ou expected; o que não vier fica como está. Marca sozinho no técnico o equipamento que ainda não estava marcado, para a nota entrar na matriz. Só vale para colaborador com cargo técnico.`,
      inputSchema: {
        memberId: id("do técnico"),
        notas: z.array(scoreChange).min(1).max(MAX_BULK_ENTRIES),
      },
      annotations: CHANGE,
    },
    toolWriter(log)("dar_nota_matriz", ({ memberId, notas }) => saveScores(uc, memberId, notas)),
  );
}

// As notas gravam primeiro: o caso de uso confere cargo e habilidade arquivada antes de marcar qualquer equipamento.
async function saveScores(uc: McpUseCases, memberId: string, changes: readonly ScoreChange[]) {
  const [matrix, catalog] = await Promise.all([uc.memberMatrix.show(memberId), uc.matrixCatalog.show()]);
  const current = new Map(matrix.entries.map((entry) => [entry.skillId, entry]));
  const entries = changes.map((change) => mergeScore(current.get(change.skillId), change));
  const scored = await uc.memberMatrix.setSkills(memberId, { entries });
  const newEquipments = equipmentsToMark(scored.equipments, entries, catalog);
  const result = newEquipments.length ? await uc.memberMatrix.setEquipments(memberId, { equipments: [...scored.equipments, ...newEquipments] }) : scored;
  const names = equipmentNames(catalog);
  return {
    gravadas: entries.length,
    equipamentosMarcados: newEquipments.map((equipmentId) => names.get(equipmentId) ?? equipmentId),
    resumo: result.summary,
    porEquipamento: result.byEquipment.map(({ equipment, ...summary }) => ({ equipment: names.get(equipment) ?? equipment, ...summary })),
  };
}
