import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoCatalog, demoMachineModel, demoMachines, demoSkills } from "./demo-catalog";

describe("cadastro da demonstração", () => {
  const catalog = demoCatalog();

  it("tem Máquina 1 a 10 com TAG própria, cada uma num modelo que existe", () => {
    const machines = demoMachines(catalog);
    assert.deepEqual(machines.map((machine) => machine.tag), Array.from({ length: 10 }, (_, index) => `MAQ-${String(index + 1).padStart(2, "0")}`));
    const models = new Set(catalog.models.map((model) => model.key));
    assert.ok(machines.every((machine) => models.has(machine.model)));
  });

  it("põe as linhas em fábricas que existem", () => {
    const factories = new Set(catalog.factories.map((factory) => factory.key));
    assert.ok(catalog.lines.every((line) => factories.has(line.factory)));
  });

  it("dá a cada modelo 12 habilidades numeradas, 8 de mecânico e 4 de eletricista", () => {
    const skills = demoSkills();
    assert.equal(skills.length, 12);
    assert.equal(skills.filter((skill) => skill.category === "electrical").length, 4);
    assert.equal(skills[11].text, "Habilidade 12: diagnosticar falha elétrica");
  });

  it("acha o modelo da máquina e avisa quando a máquina não existe", () => {
    assert.equal(demoMachineModel(catalog, "m4"), "c");
    assert.throws(() => demoMachineModel(catalog, "m99"), /m99.*m1 a m10/);
  });
});
