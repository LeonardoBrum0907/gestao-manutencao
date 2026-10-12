import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { parseTeamLayout, teamLines } from "./team-layout";

const valid = { view: "schedule", rowGroup: "grade", columnGroup: "model", columnOrder: ["e2", "e1"] };

describe("disposição da Matriz da equipe", () => {
  it("aceita a disposição inteira e tira id repetido da ordem", () => {
    assert.deepEqual(parseTeamLayout({ ...valid, columnOrder: ["e2", "e1", "e2"] }), { ...valid, columnOrder: ["e2", "e1"] });
  });

  it("recusa visão, agrupamento ou ordem fora do formato, dizendo o que veio", () => {
    assert.throws(() => parseTeamLayout({ ...valid, view: "kanban" }), (error: unknown) => error instanceof DomainError && /"kanban"/.test(error.message));
    assert.throws(() => parseTeamLayout({ ...valid, rowGroup: undefined }), DomainError);
    assert.throws(() => parseTeamLayout({ ...valid, columnGroup: "factory" }), DomainError);
    assert.throws(() => parseTeamLayout({ ...valid, columnOrder: "e1" }), DomainError);
    assert.throws(() => parseTeamLayout({ ...valid, columnOrder: [""] }), DomainError);
    assert.throws(() => parseTeamLayout({ ...valid, columnOrder: ["x".repeat(65)] }), DomainError);
    assert.throws(() => parseTeamLayout(null), DomainError);
  });
});

describe("linhas da Matriz da equipe", () => {
  it("mantém só as máquinas com modelo ativo e tira a linha que fica vazia", () => {
    const lines = teamLines(
      [
        {
          id: "l1",
          name: "CAM 05",
          factoryName: "Fábrica 1",
          machines: [
            { id: "m1", name: "Blistadeira", equipmentId: "e1" },
            { id: "m2", name: "Sem modelo", equipmentId: null },
            { id: "m3", name: "Modelo arquivado", equipmentId: "e9" },
          ],
        },
        { id: "l2", name: "MED 02", factoryName: "Fábrica 1", machines: [{ id: "m4", name: "Sem modelo", equipmentId: null }] },
      ],
      ["e1"],
    );
    assert.deepEqual(lines, [{ id: "l1", name: "CAM 05", factoryName: "Fábrica 1", machines: [{ id: "m1", name: "Blistadeira", equipmentId: "e1" }] }]);
  });
});
