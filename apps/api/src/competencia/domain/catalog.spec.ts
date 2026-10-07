import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import {
  assertEquipmentCanBeRemoved,
  assertEquipmentNameAvailable,
  assertSkillCanBeRemoved,
  requireLevel,
  requireMinQualified,
  requirePerformanceTarget,
  requireQualifiedAdherence,
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

  it("só exclui equipamento sem habilidade, técnico marcado, subconjunto ou máquina", () => {
    fails(() => assertEquipmentCanBeRemoved({ skills: 3, members: 0, subassemblies: 0, machines: 0 }), "equipment_in_use", 409);
    fails(() => assertEquipmentCanBeRemoved({ skills: 0, members: 1, subassemblies: 0, machines: 0 }), "equipment_in_use", 409);
    fails(() => assertEquipmentCanBeRemoved({ skills: 0, members: 0, subassemblies: 2, machines: 0 }), "equipment_in_use", 409);
    fails(() => assertEquipmentCanBeRemoved({ skills: 0, members: 0, subassemblies: 0, machines: 1 }), "equipment_in_use", 409);
    assert.doesNotThrow(() => assertEquipmentCanBeRemoved({ skills: 0, members: 0, subassemblies: 0, machines: 0 }));
  });

  it("só exclui habilidade nunca avaliada", () => {
    fails(() => assertSkillCanBeRemoved(2), "skill_in_use", 409);
    assert.doesNotThrow(() => assertSkillCanBeRemoved(0));
  });

  it("aceita o mínimo de qualificados de 0 a 99, inteiro", () => {
    assert.equal(requireMinQualified(0), 0);
    assert.equal(requireMinQualified(3), 3);
    fails(() => requireMinQualified(-1), "invalid", 400);
    fails(() => requireMinQualified(100), "invalid", 400);
    fails(() => requireMinQualified(1.5), "invalid", 400);
    fails(() => requireMinQualified("2"), "invalid", 400);
  });

  it("aceita a aderência para qualificar de 1 a 100, inteira", () => {
    assert.equal(requireQualifiedAdherence(80), 80);
    assert.equal(requireQualifiedAdherence(100), 100);
    fails(() => requireQualifiedAdherence(0), "invalid", 400);
    fails(() => requireQualifiedAdherence(101), "invalid", 400);
    fails(() => requireQualifiedAdherence(79.5), "invalid", 400);
    fails(() => requireQualifiedAdherence(undefined), "invalid", 400);
  });

  it("aceita como meta de desempenho só uma das notas da escala", () => {
    assert.equal(requirePerformanceTarget(8), 8);
    assert.equal(requirePerformanceTarget(10), 10);
    fails(() => requirePerformanceTarget(7), "invalid", 400);
    fails(() => requirePerformanceTarget("8"), "invalid", 400);
    fails(() => requirePerformanceTarget(undefined), "invalid", 400);
  });
});
