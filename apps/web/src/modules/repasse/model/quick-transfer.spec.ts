import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextQuickStep, quickFocus } from "./quick-transfer";

describe("quickFocus", () => {
  it("prefere o equipamento clicado em quem ensina", () => assert.deepEqual(quickFocus("e1", "e2", ["e1", "e2"]), ["e1"]));
  it("usa o de quem aprende quando quem ensina foi pelo nome", () => assert.deepEqual(quickFocus(null, "e2", ["e1", "e2"]), ["e2"]));
  it("ignora equipamento fora da matriz de quem ensina", () => assert.deepEqual(quickFocus(null, "e3", ["e1"]), []));
  it("sem nenhum clique em célula, foco vazio (matriz inteira)", () => assert.deepEqual(quickFocus(null, null, ["e1"]), []));
});

describe("nextQuickStep", () => {
  const welligton = { memberId: "m_well", equipmentId: "e1" };

  it("primeiro clique escolhe quem ensina", () => {
    assert.deepEqual(nextQuickStep(null, welligton, ["e1"]), { teacher: welligton, draft: null });
  });

  it("segundo clique em outra pessoa monta o rascunho", () => {
    const step = nextQuickStep(welligton, { memberId: "m_ren", equipmentId: null }, ["e1"]);
    assert.deepEqual(step, { teacher: null, draft: { teacherId: "m_well", learnerId: "m_ren", equipmentIds: ["e1"] } });
  });

  it("clicar de novo em quem ensina desfaz", () => {
    assert.deepEqual(nextQuickStep(welligton, { memberId: "m_well", equipmentId: "e2" }, ["e1"]), { teacher: null, draft: null });
  });
});
