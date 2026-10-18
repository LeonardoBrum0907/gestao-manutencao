import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { FactoryDto, MachineDto, MatrixEquipmentDto, SubassemblyDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { NO_CADASTRO_LINKS, type CadastroLinks } from "../domain/cadastro-removal";
import { registerCadastroTools } from "./mcp-cadastro-tools";
import { registerTools } from "./mcp-tools";
import type { McpUseCases } from "./mcp-use-cases";

// Casos de uso do cadastro em memória, no lugar dos que falam com o Prisma. Guardam o que a ferramenta mandou.
class FakeFactories {
  rows: FactoryDto[] = [{ id: "f1", name: "Unidade 1" }];
  lineCount = 0;
  async list(): Promise<FactoryDto[]> {
    return this.rows;
  }
  async checkRemoval(): Promise<void> {
    if (this.lineCount) throw new DomainError("factory_has_lines", 409, "Não dá para excluir a fábrica enquanto houver linha nela.");
  }
  async remove(id: string): Promise<void> {
    this.rows = this.rows.filter((row) => row.id !== id);
  }
}

class FakeMachines {
  rows: MachineDto[] = [
    { id: "m1", lineId: "l1", equipmentId: "e1", name: "Encartuchadeira", tag: "EBS-01", manufacturer: "Uhlmann", status: "released", notes: null, hiddenSubassemblyIds: [] },
  ];
  sentUpdate: unknown = null;
  async list(): Promise<MachineDto[]> {
    return this.rows;
  }
  async update(id: string, body: Record<string, unknown>): Promise<MachineDto> {
    this.sentUpdate = body;
    return { ...this.rows[0], ...body, id } as MachineDto;
  }
  async checkRemoval(): Promise<void> {}
  async remove(id: string): Promise<void> {
    this.rows = this.rows.filter((row) => row.id !== id);
  }
}

class FakeSubassemblies {
  rows: SubassemblyDto[] = [
    { id: "s1", equipmentId: "e1", machineId: null, name: "Cabeçote", archived: false },
    { id: "s2", equipmentId: "e1", machineId: "m1", name: "Alimentador", archived: false },
  ];
  async list(): Promise<SubassemblyDto[]> {
    return this.rows;
  }
  async create(body: { equipmentId: string; machineId: string | null; name: string }): Promise<SubassemblyDto> {
    if (body.equipmentId !== "e1") throw new DomainError("equipment", 400, "Modelo de equipamento não encontrado.");
    if (this.rows.some((row) => row.name === body.name)) throw new DomainError("subassembly_name_taken", 409, `Já existe o subconjunto ${body.name}.`);
    const row = { ...body, id: `s${this.rows.length + 1}`, archived: false };
    this.rows.push(row);
    return row;
  }
  async update(id: string, body: { name: string; archived: boolean }): Promise<SubassemblyDto> {
    const row = this.rows.find((item) => item.id === id) as SubassemblyDto;
    Object.assign(row, body);
    return row;
  }
  async checkRemoval(): Promise<void> {}
  async remove(id: string): Promise<void> {
    this.rows = this.rows.filter((row) => row.id !== id);
  }
}

class FakeModelCatalog {
  equipments: MatrixEquipmentDto[] = [{ id: "e1", name: "Encartuchadeira CAM", archived: false, minQualified: 0 }];
  async show() {
    return { equipments: this.equipments, skills: [] };
  }
  async createEquipment(body: { name: string }): Promise<MatrixEquipmentDto> {
    const row = { id: `e${this.equipments.length + 1}`, name: body.name, archived: false, minQualified: 0 };
    this.equipments.push(row);
    return row;
  }
  async updateEquipment(id: string, body: Partial<MatrixEquipmentDto>): Promise<MatrixEquipmentDto> {
    const row = this.equipments.find((item) => item.id === id) as MatrixEquipmentDto;
    Object.assign(row, { name: body.name, archived: body.archived, minQualified: body.minQualified ?? row.minQualified });
    return row;
  }
}

class FakeCadastroLinks {
  machine: CadastroLinks = NO_CADASTRO_LINKS;
  async ofFactory(): Promise<CadastroLinks> {
    return NO_CADASTRO_LINKS;
  }
  async ofMachine(): Promise<CadastroLinks> {
    return this.machine;
  }
  async ofSubassembly(): Promise<CadastroLinks> {
    return NO_CADASTRO_LINKS;
  }
}

async function connect() {
  const fakes = {
    factories: new FakeFactories(),
    machines: new FakeMachines(),
    subassemblies: new FakeSubassemblies(),
    matrixCatalog: new FakeModelCatalog(),
    cadastroLinks: new FakeCadastroLinks(),
  };
  const server = new McpServer({ name: "teste", version: "0" });
  registerCadastroTools(server, fakes as unknown as McpUseCases, () => undefined);
  const client = new Client({ name: "teste", version: "0" });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  const call = async (name: string, args: Record<string, unknown>) => {
    const result = (await client.callTool({ name, arguments: args })) as CallToolResult;
    const text = result.content[0]?.type === "text" ? result.content[0].text : "";
    return { isError: result.isError === true, text, json: () => JSON.parse(text) };
  };
  return { call, ...fakes };
}

describe("ferramentas do cadastro no MCP", () => {
  it("entram junto com as outras sem repetir nome", () => {
    const server = new McpServer({ name: "teste", version: "0" });
    assert.doesNotThrow(() => registerTools(server, {} as McpUseCases, () => undefined));
  });

  it("editar_maquina manda a ficha inteira com só o campo novo trocado", async () => {
    const { call, machines } = await connect();
    await call("editar_maquina", { id: "m1", tag: null, status: "stopped" });
    assert.deepEqual(machines.sentUpdate, { lineId: "l1", equipmentId: "e1", name: "Encartuchadeira", tag: null, manufacturer: "Uhlmann", status: "stopped", notes: null });
  });

  it("criar_subconjuntos pula o nome repetido e cria o resto", async () => {
    const { call } = await connect();
    const result = (await call("criar_subconjuntos", { equipmentId: "e1", names: ["Cabeçote", "Esteira"] })).json();
    assert.deepEqual(result.criados.map((row: SubassemblyDto) => row.name), ["Esteira"]);
    assert.deepEqual(result.recusados.map((row: { name: string }) => row.name), ["Cabeçote"]);
  });

  it("criar_subconjuntos para no primeiro erro que não é de nome", async () => {
    const { call, subassemblies } = await connect();
    const result = await call("criar_subconjuntos", { equipmentId: "e9", names: ["Esteira", "Painel"] });
    assert.equal(result.isError, true);
    assert.match(result.text, /Modelo de equipamento não encontrado/);
    assert.equal(subassemblies.rows.length, 2);
  });

  it("criar_modelo grava o mínimo de qualificados quando vem", async () => {
    const { call } = await connect();
    const result = (await call("criar_modelo", { name: "Blistadeira M91", minQualified: 2 })).json();
    assert.deepEqual(result, { id: "e2", name: "Blistadeira M91", archived: false, minQualified: 2 });
  });

  it("editar_modelo arquiva sem mexer no nome", async () => {
    const { call } = await connect();
    const result = (await call("editar_modelo", { id: "e1", archived: true })).json();
    assert.deepEqual(result, { id: "e1", name: "Encartuchadeira CAM", archived: true, minQualified: 0 });
  });

  it("conferir mostra o que vai junto e não exclui", async () => {
    const { call, machines } = await connect();
    const result = (await call("excluir_do_cadastro", { tipo: "maquina", id: "m1", conferir: true })).json();
    assert.deepEqual(result, { item: "a máquina Encartuchadeira", podeExcluir: true, motivo: null, vaiJunto: ["subconjunto Alimentador"] });
    assert.equal(machines.rows.length, 1);
  });

  it("exclui a máquina quando nada está ligado", async () => {
    const { call, machines } = await connect();
    const result = (await call("excluir_do_cadastro", { tipo: "maquina", id: "m1" })).json();
    assert.deepEqual(result, { excluido: "a máquina Encartuchadeira", foiJunto: ["subconjunto Alimentador"] });
    assert.equal(machines.rows.length, 0);
  });

  it("recusa excluir a máquina que tem RP ligado, mesmo a tela deixando", async () => {
    const { call, machines, cadastroLinks } = await connect();
    cadastroLinks.machine = { records: 0, rps: 1, techCards: 0 };
    const result = await call("excluir_do_cadastro", { tipo: "maquina", id: "m1" });
    assert.equal(result.isError, true);
    assert.match(result.text, /1 RP/);
    assert.equal(machines.rows.length, 1);
  });

  it("recusa com a regra da tela (fábrica com linha)", async () => {
    const { call, factories } = await connect();
    factories.lineCount = 1;
    const check = (await call("excluir_do_cadastro", { tipo: "fabrica", id: "f1", conferir: true })).json();
    assert.equal(check.podeExcluir, false);
    assert.match(check.motivo, /linha/);
    assert.equal((await call("excluir_do_cadastro", { tipo: "fabrica", id: "f1" })).isError, true);
    assert.equal(factories.rows.length, 1);
  });

  it("id desconhecido volta com o id recebido", async () => {
    const { call } = await connect();
    const result = await call("excluir_do_cadastro", { tipo: "subconjunto", id: "nao-existe" });
    assert.equal(result.isError, true);
    assert.match(result.text, /nao-existe/);
  });
});
