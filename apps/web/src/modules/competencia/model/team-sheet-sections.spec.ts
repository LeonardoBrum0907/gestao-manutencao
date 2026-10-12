import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseTeamSheetSections, teamSheetPath } from "./team-sheet-sections";

describe("partes da folha A4 da Matriz da equipe", () => {
  it("lê só as partes conhecidas, na ordem da folha", () => {
    assert.deepEqual(parseTeamSheetSections("treino,xyz,grade"), ["grade", "treino"]);
  });

  it("sem pedido válido, sai a folha completa", () => {
    assert.deepEqual(parseTeamSheetSections(null), ["numeros", "grade", "subtotais", "legenda", "treino"]);
    assert.deepEqual(parseTeamSheetSections("nada"), ["numeros", "grade", "subtotais", "legenda", "treino"]);
  });

  it("monta o endereço mantendo os filtros e omite secoes quando vai tudo", () => {
    const filters = new URLSearchParams("turno=first&secoes=velho");
    assert.equal(teamSheetPath(filters, ["grade", "legenda"]), "/competencias/folha?turno=first&secoes=grade%2Clegenda");
    assert.equal(teamSheetPath(filters, ["numeros", "grade", "subtotais", "legenda", "treino"]), "/competencias/folha?turno=first");
  });
});
