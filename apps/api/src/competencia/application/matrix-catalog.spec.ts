import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MatrixCatalogDto, MatrixEquipmentDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import type { CatalogRepository } from "../infra/catalog.repository";
import { MatrixCatalog } from "./matrix-catalog";

// Catálogo em memória no lugar do CatalogRepository (que fala com o Prisma).
class FakeCatalogRepository {
  equipments: MatrixEquipmentDto[] = [
    { id: "e1", name: "Blistadeira CAM", archived: false, minQualified: 0 },
    { id: "e2", name: "Encartuchadeira CAM", archived: false, minQualified: 0 },
  ];

  async load(): Promise<MatrixCatalogDto> {
    return { equipments: this.equipments, skills: [] };
  }

  async findEquipment(id: string): Promise<MatrixEquipmentDto | null> {
    return this.equipments.find((equipment) => equipment.id === id) ?? null;
  }

  async findEquipmentByName(name: string): Promise<MatrixEquipmentDto | null> {
    return this.equipments.find((equipment) => equipment.name === name) ?? null;
  }

  async createEquipment(name: string): Promise<MatrixEquipmentDto> {
    const equipment = { id: `e${this.equipments.length + 1}`, name, archived: false, minQualified: 0 };
    this.equipments.push(equipment);
    return equipment;
  }

  async updateEquipment(id: string, input: { name: string; archived: boolean }): Promise<MatrixEquipmentDto> {
    const index = this.equipments.findIndex((equipment) => equipment.id === id);
    this.equipments[index] = { ...this.equipments[index], ...input };
    return this.equipments[index];
  }
}

function catalogOver(repository: FakeCatalogRepository): MatrixCatalog {
  return new MatrixCatalog(repository as unknown as CatalogRepository);
}

async function rejectsTakenName(run: () => Promise<unknown>) {
  await assert.rejects(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, "equipment_name_taken");
    assert.equal(error.statusCode, 409);
    return true;
  });
}

describe("nome do modelo de equipamento", () => {
  it("recusa criar modelo com o nome de outro", async () => {
    await rejectsTakenName(() => catalogOver(new FakeCatalogRepository()).createEquipment({ name: "Blistadeira CAM" }));
  });

  it("aceita nome novo e renomear mantendo o próprio nome", async () => {
    const repository = new FakeCatalogRepository();
    const catalog = catalogOver(repository);
    assert.equal((await catalog.createEquipment({ name: "Blistadeira Uhlmann" })).name, "Blistadeira Uhlmann");
    assert.equal((await catalog.updateEquipment("e1", { name: "Blistadeira CAM", archived: true })).archived, true);
  });

  it("recusa renomear para o nome de outro", async () => {
    await rejectsTakenName(() => catalogOver(new FakeCatalogRepository()).updateEquipment("e2", { name: "Blistadeira CAM", archived: false }));
  });
});

// Regressão: "blistadeira cam" entrava ao lado de "Blistadeira CAM" e o mesmo modelo aparecia duas vezes.
describe("nome do modelo que só muda maiúscula", () => {
  it("recusa ao criar e ao renomear", async () => {
    await rejectsTakenName(() => catalogOver(new FakeCatalogRepository()).createEquipment({ name: "blistadeira cam" }));
    await rejectsTakenName(() => catalogOver(new FakeCatalogRepository()).updateEquipment("e2", { name: "BLISTADEIRA CAM", archived: false }));
  });

  it("deixa o próprio modelo trocar só a maiúscula", async () => {
    const renamed = await catalogOver(new FakeCatalogRepository()).updateEquipment("e1", { name: "Blistadeira Cam", archived: false });
    assert.equal(renamed.name, "Blistadeira Cam");
  });
});
