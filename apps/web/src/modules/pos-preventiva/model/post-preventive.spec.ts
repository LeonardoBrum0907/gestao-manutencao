import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubassemblyDto } from "@manutencao/shared";
import { subassemblyFilterOptions } from "./post-preventive";

function sub(id: string, scope: Partial<SubassemblyDto> = {}): SubassemblyDto {
  return { id, equipmentId: "blis", machineId: null, name: id, archived: false, ...scope };
}

describe("opções do filtro Subconjunto da lista de pós-preventiva", () => {
  const all = [
    sub("modelo"),
    sub("so-m1", { machineId: "m1" }),
    sub("so-m2", { machineId: "m2" }),
    sub("arquivado", { archived: true }),
    sub("desmarcado"),
    sub("outro-modelo", { equipmentId: "enc" }),
  ];
  const machine = { id: "m1", equipmentId: "blis", hiddenSubassemblyIds: ["desmarcado"] };

  it("tira os subconjuntos só de outra máquina do mesmo modelo e os de outro modelo", () => {
    const ids = subassemblyFilterOptions(all, machine).map((item) => item.id);
    assert.deepEqual(ids, ["modelo", "so-m1", "arquivado", "desmarcado"]);
  });

  it("fica vazio sem máquina escolhida ou com máquina sem modelo", () => {
    assert.deepEqual(subassemblyFilterOptions(all, undefined), []);
    assert.deepEqual(subassemblyFilterOptions(all, { ...machine, equipmentId: null }), []);
  });
});
