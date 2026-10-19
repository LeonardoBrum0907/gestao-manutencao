import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PublicRpDirectoryDto, RpDraftDto } from "@manutencao/shared";
import {
  memberChoices,
  newPublicValues,
  placeOf,
  publicBodyFromValues,
  publicRpPath,
  publicRpUrl,
  rememberMember,
  rememberedMember,
  withLine,
  valuesFromPastedRp,
  withMachine,
} from "./public-rp";

const lines: PublicRpDirectoryDto["lines"] = [{ id: "l1", name: "Cam 08", internalCode: null, factoryId: "f2" }];
const machines: PublicRpDirectoryDto["machines"] = [
  { id: "mq1", name: "Blistadeira", tag: "EBS-BLI-31", lineId: "l1" },
  { id: "mq2", name: "Esteira", tag: null, lineId: "l1" },
];

class FakeStorage {
  items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
}

class BrokenStorage {
  getItem(): string | null {
    throw new Error("bloqueado");
  }
  setItem(): void {
    throw new Error("bloqueado");
  }
  removeItem(): void {
    throw new Error("bloqueado");
  }
}

describe("caminhos do link", () => {
  it("monta o caminho e o endereço completo", () => {
    assert.equal(publicRpPath("abc", "rp1", "editar"), "/rp/abrir/abc/rp1/editar");
    assert.equal(publicRpUrl("https://app.exemplo/", "abc"), "https://app.exemplo/rp/abrir/abc");
  });
});

describe("técnico do aparelho", () => {
  it("guarda, lê e apaga", () => {
    const storage = new FakeStorage();
    rememberMember(storage, "m1");
    assert.equal(rememberedMember(storage), "m1");
    rememberMember(storage, "");
    assert.equal(rememberedMember(storage), "");
  });

  it("sem armazenamento não quebra", () => {
    assert.equal(rememberedMember(new BrokenStorage()), "");
    assert.doesNotThrow(() => rememberMember(new BrokenStorage(), "m1"));
    assert.equal(rememberedMember(null), "");
  });

  it("RP novo já vem com o técnico do aparelho", () => {
    assert.deepEqual(newPublicValues("m1").memberIds, ["m1"]);
    assert.deepEqual(newPublicValues("").memberIds, []);
  });
});

describe("linha e máquina", () => {
  it("a linha traz a fábrica e o nome, e zera a máquina", () => {
    const values = withLine({ ...newPublicValues(""), machineId: "velha" }, "l1", lines);
    assert.equal(values.factoryId, "f2");
    assert.equal(values.line, "Cam 08");
    assert.equal(values.machineId, "");
  });

  it("outra linha deixa escrever à mão", () => {
    const values = withLine({ ...newPublicValues(""), lineId: "l1", line: "Cam 08" }, "", lines);
    assert.equal(values.lineId, "");
    assert.equal(values.line, "Cam 08");
  });

  it("a máquina preenche a TAG; sem TAG no cadastro, fica a escrita", () => {
    assert.equal(withMachine(newPublicValues(""), "mq1", machines).tag, "EBS-BLI-31");
    assert.equal(withMachine({ ...newPublicValues(""), tag: "MINHA" }, "mq2", machines).tag, "MINHA");
  });
});

describe("publicBodyFromValues", () => {
  it("manda nulo no que ficou em branco e esquece as vezes se a falha não é repetida", () => {
    const values = { ...newPublicValues("m1"), factoryId: "f1", problem: "Travou", orderNumber: "  ", repeatedTimes: "3" };
    const body = publicBodyFromValues(values, { revised: false, website: "" });
    assert.equal(body.orderNumber, null);
    assert.equal(body.repeatedTimes, null);
    assert.equal(body.website, "");
    assert.equal("subassemblyId" in body, false);
  });
});

describe("placeOf", () => {
  it("usa o nome da linha do cadastro e não repete a TAG igual", () => {
    assert.deepEqual(placeOf({ lineId: "l1", line: "cam08", tag: "EBS-1" }, new Map([["l1", "Cam 08"]])), ["Cam 08", "EBS-1"]);
    assert.deepEqual(placeOf({ lineId: null, line: "Cam 08", tag: "cam 08" }, new Map()), ["Cam 08"]);
  });
});

describe("memberChoices", () => {
  it("junta quem o RP já tem, mesmo fora da lista", () => {
    const choices = memberChoices([{ id: "m1", name: "Rogério B" }], { memberIds: ["m1", "m9"], memberNames: ["Rogério B", "Carla"] });
    assert.deepEqual(choices, [
      { value: "m1", label: "Rogério B" },
      { value: "m9", label: "Carla" },
    ]);
  });
});

describe("valuesFromPastedRp", () => {
  const noCause = { marked: false, text: null };
  const directory: PublicRpDirectoryDto = { factories: [], lines, machines, members: [{ id: "m1", name: "Rogério B" }] };
  function draft(patch: Partial<RpDraftDto> = {}): RpDraftDto {
    return {
      occurredAt: "2026-10-04T12:00:00.000Z", orderNumber: null, factoryId: null, lineId: null, line: "Cam 8", tag: "EBS-BLI-31",
      machineId: null, subassemblyId: null, problem: "Alarme", description: null, repeatedFailure: false, repeatedTimes: null,
      repeatedPeriod: null, causes: { material: noCause, machine: noCause, method: noCause, labor: noCause }, rootCause: null,
      corrective: null, preventive: null, status: "corrected", basicConditionImpact: null, memberIds: [],
      unmatchedTechnicians: "Zé", rawText: "texto", warnings: [], ...patch,
    };
  }

  it("a TAG acha a máquina, a linha e a fábrica do cadastro", () => {
    const values = valuesFromPastedRp(draft(), directory, "");
    assert.deepEqual([values.machineId, values.lineId, values.factoryId, values.problem], ["mq1", "l1", "f2", "Alarme"]);
    assert.equal(values.occurredAt, "2026-10-04");
  });

  it("sem técnico liberado no texto, entra o do aparelho; com técnico, fica o do texto", () => {
    assert.deepEqual(valuesFromPastedRp(draft(), directory, "m1").memberIds, ["m1"]);
    assert.deepEqual(valuesFromPastedRp(draft({ memberIds: ["m9"] }), directory, "m1").memberIds, ["m9"]);
    assert.equal(valuesFromPastedRp(draft(), directory, "m1").unmatchedTechnicians, "");
  });
});
