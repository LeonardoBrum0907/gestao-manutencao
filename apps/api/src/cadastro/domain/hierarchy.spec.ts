import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertLineCanBeRemoved, assertMachineSpot, assertSubassemblyFits, assertSubassemblyNameAvailable } from "./hierarchy";

function refused(run: () => void, code: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    assert.equal(error.statusCode, 409);
    return true;
  });
}

function refusedSaying(run: () => void, message: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.message, message);
    return true;
  });
}

describe("exclusão de linha", () => {
  it("recusa quando a linha tem máquina", () => {
    refused(() => assertLineCanBeRemoved(2), "line_has_machines");
  });

  it("permite quando não há máquina", () => {
    assert.doesNotThrow(() => assertLineCanBeRemoved(0));
  });
});

describe("nome do subconjunto", () => {
  const model = { versionId: null, machineId: null };
  const siblings = [
    { id: "a", name: "Esteira de Saída", ...model },
    { id: "b", name: "Magazine de Cartucho", ...model },
    { id: "c", name: "Balança", versionId: null, machineId: "m1" },
    { id: "d", name: "Selagem fria", versionId: "nmx", machineId: null },
  ];
  const versionOf = (machineId: string) => ({ m1: "m092", m2: "m092", m3: "nmx" })[machineId] ?? null;

  it("recusa repetido no mesmo modelo, ignorando acento e maiúsculas", () => {
    refused(() => assertSubassemblyNameAvailable("esteira de  saida", model, siblings, null, versionOf), "subassembly_name_taken");
  });

  it("aceita o próprio nome ao editar", () => {
    assert.doesNotThrow(() => assertSubassemblyNameAvailable("Esteira de Saída", model, siblings, "a", versionOf));
  });

  it("aceita nome novo", () => {
    assert.doesNotThrow(() => assertSubassemblyNameAvailable("Válvulas roletes", model, siblings, null, versionOf));
  });

  it("aceita o mesmo nome só-desta-máquina em outra máquina", () => {
    assert.doesNotThrow(() => assertSubassemblyNameAvailable("Balança", { versionId: null, machineId: "m2" }, siblings, null, versionOf));
  });

  it("recusa no modelo um nome que já existe numa máquina dele", () => {
    refused(() => assertSubassemblyNameAvailable("Balança", model, siblings, null, versionOf), "subassembly_name_taken");
  });

  it("separa versões: o nome da NMX pode repetir na M092, mas não numa máquina NMX", () => {
    assert.doesNotThrow(() => assertSubassemblyNameAvailable("Selagem fria", { versionId: "m092", machineId: null }, siblings, null, versionOf));
    refused(() => assertSubassemblyNameAvailable("Selagem fria", { versionId: null, machineId: "m3" }, siblings, null, versionOf), "subassembly_name_taken");
  });
});

describe("subconjunto da máquina", () => {
  const machine = { id: "m1", equipmentId: "encartuchadeira-cam", versionId: null, hiddenSubassemblyIds: [] };
  const sub = { id: "s1", equipmentId: "encartuchadeira-cam", versionId: null, machineId: null, archived: false };

  it("aceita subconjunto do modelo da máquina", () => {
    assert.doesNotThrow(() => assertSubassemblyFits(machine, sub, null));
  });

  it("recusa subconjunto de outro modelo", () => {
    refusedSaying(() => assertSubassemblyFits(machine, { ...sub, equipmentId: "blistadeira-cam" }, null), "Este subconjunto não é do modelo desta máquina.");
  });

  it("recusa máquina sem modelo", () => {
    assert.throws(() => assertSubassemblyFits({ ...machine, equipmentId: null }, sub, null), DomainError);
  });

  it("arquivado só fica se a ficha já apontava para ele", () => {
    const archived = { ...sub, archived: true };
    refusedSaying(() => assertSubassemblyFits(machine, archived, null), "Este subconjunto está arquivado.");
    assert.doesNotThrow(() => assertSubassemblyFits(machine, archived, "s1"));
  });

  it("aceita o da versão e o da própria máquina, recusa os de outra versão ou máquina", () => {
    const m092 = { ...machine, versionId: "m092" };
    assert.doesNotThrow(() => assertSubassemblyFits(m092, { ...sub, versionId: "m092" }, null));
    assert.doesNotThrow(() => assertSubassemblyFits(m092, { ...sub, machineId: "m1" }, null));
    refusedSaying(() => assertSubassemblyFits(m092, { ...sub, versionId: "nmx" }, null), "Este subconjunto é de outra versão ou de outra máquina.");
    refusedSaying(() => assertSubassemblyFits(m092, { ...sub, machineId: "m2" }, null), "Este subconjunto é de outra versão ou de outra máquina.");
  });

  it("recusa o que a máquina desmarcou, a não ser que a ficha já apontasse para ele", () => {
    const hiding = { ...machine, hiddenSubassemblyIds: ["s1"] };
    refusedSaying(() => assertSubassemblyFits(hiding, sub, null), "Esta máquina não tem este subconjunto (está desmarcado na tela da máquina).");
    assert.doesNotThrow(() => assertSubassemblyFits(hiding, sub, "s1"));
  });
});

describe("máquina e subconjunto de uma ficha", () => {
  const machine = { id: "m1", lineId: "med-03", equipmentId: "encartuchadeira-cam", versionId: null, hiddenSubassemblyIds: [] };
  const subassembly = { id: "s1", equipmentId: "encartuchadeira-cam", versionId: null, machineId: null, archived: false };
  const refs = { machine, subassembly };

  it("aceita ficha sem máquina", () => {
    assert.doesNotThrow(() => assertMachineSpot({ lineId: null, machineId: null, subassemblyId: null }, { machine: null, subassembly: null }, null));
  });

  it("aceita máquina da linha e subconjunto do modelo dela", () => {
    assert.doesNotThrow(() => assertMachineSpot({ lineId: "med-03", machineId: "m1", subassemblyId: "s1" }, refs, null));
  });

  it("pede máquina para o subconjunto e linha para a máquina", () => {
    refusedSaying(() => assertMachineSpot({ lineId: "med-03", machineId: null, subassemblyId: "s1" }, refs, null), "Escolha a máquina do subconjunto.");
    refusedSaying(() => assertMachineSpot({ lineId: null, machineId: "m1", subassemblyId: null }, refs, null), "Escolha a linha da máquina.");
  });

  it("recusa máquina de outra linha", () => {
    refusedSaying(() => assertMachineSpot({ lineId: "uhlmann-01", machineId: "m1", subassemblyId: null }, refs, null), "Esta máquina não é da linha escolhida.");
  });

  it("recusa máquina ou subconjunto que não existem", () => {
    refusedSaying(() => assertMachineSpot({ lineId: "med-03", machineId: "m9", subassemblyId: null }, { machine: null, subassembly: null }, null), "Máquina não encontrada (id m9).");
    refusedSaying(() => assertMachineSpot({ lineId: "med-03", machineId: "m1", subassemblyId: "s9" }, { machine, subassembly: null }, null), "Subconjunto não encontrado (id s9).");
  });

  it("recusa subconjunto de outro modelo", () => {
    const other = { ...subassembly, equipmentId: "blistadeira-cam" };
    refusedSaying(() => assertMachineSpot({ lineId: "med-03", machineId: "m1", subassemblyId: "s1" }, { machine, subassembly: other }, null), "Este subconjunto não é do modelo desta máquina.");
  });
});
