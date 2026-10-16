import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { CompetencyEntryDto, CompetencySummaryDto, MatrixCatalogDto, MatrixSkillDto, MemberMatrixDto } from "@manutencao/shared";
import type { SkillWrite } from "../../competencia/infra/catalog.repository";
import { registerMatrixTools } from "./mcp-matrix-tools";
import type { McpUseCases } from "./mcp-use-cases";

const EMPTY_SUMMARY: CompetencySummaryDto = {
  applicable: 0, scored: 0, meets: 0, above: 0, exact: 0, below: 0, unscored: 0, notApplicable: 0, average: null, adherence: null,
};

// Catálogo em memória no lugar do MatrixCatalog (que fala com o Prisma).
class FakeMatrixCatalog {
  catalog: MatrixCatalogDto = {
    equipments: [
      { id: "e1", name: "Envasadora", archived: false, minQualified: 0 },
      { id: "e2", name: "Rotuladora", archived: false, minQualified: 0 },
    ],
    skills: [{ id: "s1", equipmentId: "e1", subgroup: "Cabeçote", text: "Trocar a faca", level: "basic", category: "mechanical", archived: false }],
  };

  async show(): Promise<MatrixCatalogDto> {
    return this.catalog;
  }

  async createSkill(input: SkillWrite): Promise<MatrixSkillDto> {
    const skill = { ...input, id: `s${this.catalog.skills.length + 1}`, level: input.level as MatrixSkillDto["level"], category: input.category as MatrixSkillDto["category"], archived: false };
    this.catalog.skills.push(skill);
    return skill;
  }

  async updateSkill(id: string, body: Record<string, unknown>): Promise<MatrixSkillDto> {
    const index = this.catalog.skills.findIndex((skill) => skill.id === id);
    this.catalog.skills[index] = { ...this.catalog.skills[index], ...body } as MatrixSkillDto;
    return this.catalog.skills[index];
  }
}

// Matriz de um técnico em memória no lugar do MemberMatrix; guarda o que a ferramenta mandou.
class FakeMemberMatrix {
  entries: CompetencyEntryDto[] = [{ skillId: "s1", score: 1, notApplicable: false, expected: 3 }];
  equipments: string[] = ["e1"];
  sentEntries: unknown = null;

  async show(memberId: string): Promise<MemberMatrixDto> {
    return {
      memberId,
      gradeName: null,
      matrixCategory: null,
      expectedByLevel: { basic: 2, intermediate: 3, advanced: 4 },
      equipments: this.equipments,
      entries: this.entries,
      summary: EMPTY_SUMMARY,
      byEquipment: this.equipments.map((equipment) => ({ equipment, ...EMPTY_SUMMARY })),
    };
  }

  async setSkills(memberId: string, body: { entries: CompetencyEntryDto[] }): Promise<MemberMatrixDto> {
    this.sentEntries = body.entries;
    return this.show(memberId);
  }

  async setEquipments(memberId: string, body: { equipments: string[] }): Promise<MemberMatrixDto> {
    this.equipments = body.equipments;
    return this.show(memberId);
  }
}

async function connect() {
  const matrixCatalog = new FakeMatrixCatalog();
  const memberMatrix = new FakeMemberMatrix();
  const uc = { matrixCatalog, memberMatrix } as unknown as McpUseCases;
  const server = new McpServer({ name: "teste", version: "0" });
  registerMatrixTools(server, uc, () => undefined);
  const client = new Client({ name: "teste", version: "0" });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  const call = async (name: string, args: Record<string, unknown>) => {
    const result = (await client.callTool({ name, arguments: args })) as CallToolResult;
    const text = result.content[0]?.type === "text" ? result.content[0].text : "";
    return { isError: result.isError === true, text, json: () => JSON.parse(text) };
  };
  return { call, matrixCatalog, memberMatrix };
}

describe("ferramentas da matriz no MCP", () => {
  it("catálogo filtra pela busca e traz o nome do equipamento", async () => {
    const { call } = await connect();
    const result = (await call("catalogo_da_matriz", { busca: "faca" })).json();
    assert.equal(result.habilidades.length, 1);
    assert.equal(result.habilidades[0].equipment, "Envasadora");
  });

  it("cadastra habilidades, pula a repetida e reaproveita a grafia do subconjunto", async () => {
    const { call, matrixCatalog } = await connect();
    const result = (
      await call("cadastrar_habilidades", {
        habilidades: [
          { equipmentId: "e1", subgroup: "cabecote", text: "Ajustar a altura", level: "intermediate" },
          { equipmentId: "e1", subgroup: "Cabeçote", text: "trocar a faca", level: "basic" },
        ],
      })
    ).json();
    assert.deepEqual(result.criadas.map((skill: MatrixSkillDto) => skill.subgroup), ["Cabeçote"]);
    assert.deepEqual(result.puladas.map((skill: MatrixSkillDto) => skill.id), ["s1"]);
    assert.equal(matrixCatalog.catalog.skills.length, 2);
  });

  it("habilidade sem categoria vai para mecânico, e o mesmo texto de eletricista não é repetido", async () => {
    const { call } = await connect();
    const result = (
      await call("cadastrar_habilidades", {
        habilidades: [
          { equipmentId: "e1", subgroup: "Painel", text: "Medir a tensão", level: "basic" },
          { equipmentId: "e1", subgroup: "Cabeçote", text: "Trocar a faca", level: "basic", category: "electrical" },
        ],
      })
    ).json();
    assert.deepEqual(result.criadas.map((skill: MatrixSkillDto) => skill.category), ["mechanical", "electrical"]);
    assert.equal(result.puladas.length, 0);
  });

  it("catálogo filtra pela categoria", async () => {
    const { call, matrixCatalog } = await connect();
    matrixCatalog.catalog.skills.push({ id: "s9", equipmentId: "e1", subgroup: "Painel", text: "Medir a tensão", level: "basic", category: "electrical", archived: false });
    const result = (await call("catalogo_da_matriz", { categoria: "electrical" })).json();
    assert.deepEqual(result.habilidades.map((skill: MatrixSkillDto) => skill.id), ["s9"]);
  });

  it("recusa equipamento que não existe antes de gravar qualquer habilidade", async () => {
    const { call, matrixCatalog } = await connect();
    const result = await call("cadastrar_habilidades", {
      habilidades: [
        { equipmentId: "e1", subgroup: "Cabeçote", text: "Nova", level: "basic" },
        { equipmentId: "nao-existe", subgroup: "X", text: "Outra", level: "basic" },
      ],
    });
    assert.equal(result.isError, true);
    assert.match(result.text, /nao-existe/);
    assert.equal(matrixCatalog.catalog.skills.length, 1);
  });

  it("edita só o campo que veio", async () => {
    const { call } = await connect();
    const result = (await call("editar_habilidade", { id: "s1", archived: true })).json();
    assert.deepEqual(result, { id: "s1", equipmentId: "e1", subgroup: "Cabeçote", text: "Trocar a faca", level: "basic", category: "mechanical", archived: true });
  });

  it("dá nota mantendo o esperado e marca o equipamento novo", async () => {
    const { call, matrixCatalog, memberMatrix } = await connect();
    matrixCatalog.catalog.skills.push({ id: "s2", equipmentId: "e2", subgroup: "Cola", text: "Limpar o rolo", level: "basic", category: "mechanical", archived: false });
    const result = (await call("dar_nota_matriz", { memberId: "m1", notas: [{ skillId: "s1", score: 3 }, { skillId: "s2", score: 2 }] })).json();
    assert.deepEqual(memberMatrix.sentEntries, [
      { skillId: "s1", score: 3, notApplicable: false, expected: 3 },
      { skillId: "s2", score: 2, notApplicable: false, expected: null },
    ]);
    assert.deepEqual(memberMatrix.equipments, ["e1", "e2"]);
    assert.deepEqual(result.equipamentosMarcados, ["Rotuladora"]);
    assert.deepEqual(result.porEquipamento.map((row: { equipment: string }) => row.equipment), ["Envasadora", "Rotuladora"]);
  });
});
