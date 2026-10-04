import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import {
  assertEquipmentCanBeRemoved,
  assertEquipmentNameAvailable,
  assertSkillCanBeRemoved,
  requireLevel,
  requireText,
} from "./catalog";

function fails(run: () => unknown, code: string, statusCode: number) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    assert.equal(error.statusCode, statusCode);
    return true;
  });
}

describe("cadastro da matriz", () => {
  it("aceita só os três níveis", () => {
    assert.equal(requireLevel("advanced"), "advanced");
    fails(() => requireLevel("expert"), "invalid", 400);
  });

  it("recusa texto em branco", () => {
    assert.equal(requireText("  Trocar faca  ", "x"), "Trocar faca");
    fails(() => requireText("   ", "Escreva a habilidade."), "invalid", 400);
  });

  it("recusa nome de equipamento já usado", () => {
    fails(() => assertEquipmentNameAvailable("outro", null), "equipment_name_taken", 409);
    assert.doesNotThrow(() => assertEquipmentNameAvailable("este", "este"));
  });

  it("só exclui equipamento sem habilidade e sem técnico marcado", () => {
    fails(() => assertEquipmentCanBeRemoved({ skills: 3, members: 0 }), "equipment_in_use", 409);
    fails(() => assertEquipmentCanBeRemoved({ skills: 0, members: 1 }), "equipment_in_use", 409);
    assert.doesNotThrow(() => assertEquipmentCanBeRemoved({ skills: 0, members: 0 }));
  });

  it("só exclui habilidade nunca avaliada", () => {
    fails(() => assertSkillCanBeRemoved(2), "skill_in_use", 409);
    assert.doesNotThrow(() => assertSkillCanBeRemoved(0));
  });
});
