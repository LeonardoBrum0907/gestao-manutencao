import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RecordStatus } from "@manutencao/shared";
import { chamadosDaySummary } from "./chamado-summary";

const of = (...statuses: RecordStatus[]) => statuses.map((status) => ({ status }));

describe("resumo do dia na tela de Chamados", () => {
  it("dia sem chamado não tem resumo", () => {
    assert.equal(chamadosDaySummary([]), "");
  });

  it("conta um de cada status, na ordem do turno", () => {
    assert.equal(chamadosDaySummary(of("in_progress", "open", "done")), "3 chamados · 1 liberado · 1 pendente · 1 em andamento");
  });

  it("um chamado só fica no singular", () => {
    assert.equal(chamadosDaySummary(of("open")), "1 chamado · 1 pendente");
  });

  it("vários do mesmo status vão para o plural", () => {
    assert.equal(chamadosDaySummary(of("done", "done", "open", "open", "in_progress", "in_progress")), "6 chamados · 2 liberados · 2 pendentes · 2 em andamento");
  });
});
