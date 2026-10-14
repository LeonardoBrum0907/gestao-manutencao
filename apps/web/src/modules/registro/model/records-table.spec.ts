import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RecordListItemDto } from "@manutencao/shared";
import { defaultRecordOrder, filterRecords, matchesSearch, placeLabel, recordGroup, sortByGroup, withNames, type RecordFilter, type RecordRow } from "./records-table";

const names = {
  lines: new Map([["l1", "MED 01"], ["l2", "CAM 01"]]),
  machines: new Map([["m1", "Blistadeira"]]),
  subassemblies: new Map([["s1", "Desbobinador"]]),
  members: new Map([["p1", "Dennes Oliveira"]]),
};

function item(id: string, partial: Partial<RecordListItemDto> = {}): RecordListItemDto {
  return {
    id,
    type: "task",
    body: id,
    occurredAt: "2026-10-10T12:00:00.000Z",
    status: "open",
    origin: "inbox",
    priority: null,
    tone: null,
    dueAt: null,
    lineId: null,
    machineId: null,
    subassemblyId: null,
    memberId: null,
    ...partial,
  };
}

const all: RecordFilter = { q: "", type: null, scope: "todos", lineId: null, memberId: null };

describe("linhas de Registros", () => {
  const problem = withNames(item("p", { type: "problem", body: "Filme soltando", lineId: "l1", machineId: "m1", subassemblyId: "s1" }), names);

  it("junta os nomes do cadastro e monta o lugar", () => {
    assert.equal(placeLabel(problem), "MED 01 › Blistadeira › Desbobinador");
    assert.equal(placeLabel(withNames(item("t"), names)), "");
  });

  it("procura sem acento, em todas as palavras, no texto, no lugar e na pessoa", () => {
    assert.equal(matchesSearch(problem, "desbobinador med"), true);
    assert.equal(matchesSearch(problem, "FILME blistadeira"), true);
    assert.equal(matchesSearch(problem, "filme cam"), false);
    const feedback = withNames(item("f", { type: "feedback", body: "Atenção ao checklist", memberId: "p1" }), names);
    assert.equal(matchesSearch(feedback, "atencao dennes"), true);
  });
});

describe("filtros de Registros", () => {
  const rows: RecordRow[] = [
    withNames(item("aberta", { lineId: "l1" }), names),
    withNames(item("feita", { status: "done", lineId: "l2" }), names),
    withNames(item("problema", { type: "problem", status: "in_progress", lineId: "l1" }), names),
    withNames(item("feedback", { type: "feedback", memberId: "p1" }), names),
  ];
  const ids = (list: RecordRow[]) => list.map((row) => row.id);

  it("filtra por situação, tipo, linha e pessoa", () => {
    assert.deepEqual(ids(filterRecords(rows, { ...all, scope: "abertos" })), ["aberta", "problema", "feedback"]);
    assert.deepEqual(ids(filterRecords(rows, { ...all, scope: "concluidos" })), ["feita"]);
    assert.deepEqual(ids(filterRecords(rows, { ...all, type: "problem" })), ["problema"]);
    assert.deepEqual(ids(filterRecords(rows, { ...all, lineId: "l1" })), ["aberta", "problema"]);
    assert.deepEqual(ids(filterRecords(rows, { ...all, memberId: "p1" })), ["feedback"]);
  });

  it("ignora o tipo para contar as abas", () => {
    assert.equal(filterRecords(rows, { ...all, type: "problem" }, true).length, 4);
  });

  it("sem ordenação: em andamento, abertos e depois concluídos; dentro, os mais novos primeiro", () => {
    const newer = withNames(item("nova", { occurredAt: "2026-10-12T12:00:00.000Z" }), names);
    assert.deepEqual(ids([...rows, newer].sort(defaultRecordOrder)), ["problema", "nova", "aberta", "feedback", "feita"]);
  });
});

describe("agrupar Registros", () => {
  const rows: RecordRow[] = [
    withNames(item("sem-linha"), names),
    withNames(item("cam", { lineId: "l2" }), names),
    withNames(item("med", { lineId: "l1", machineId: "m1" }), names),
  ];

  it("agrupa por linha com o Sem linha por último", () => {
    assert.deepEqual(sortByGroup(rows, "linha").map((row) => recordGroup(row, "linha").title), ["CAM 01", "MED 01", "Sem linha"]);
  });

  it("máquina vem com a linha, porque o nome se repete entre linhas", () => {
    assert.equal(recordGroup(rows[2], "maquina").title, "MED 01 · Blistadeira");
    assert.equal(recordGroup(rows[1], "maquina").title, "Sem máquina");
  });

  it("tipo e situação seguem a ordem da tela, não a alfabética", () => {
    const problem = withNames(item("p", { type: "problem", status: "in_progress" }), names);
    assert.deepEqual(sortByGroup([problem, rows[0]], "tipo").map((row) => row.id), ["sem-linha", "p"]);
    assert.deepEqual(sortByGroup([rows[0], problem], "situacao").map((row) => row.id), ["p", "sem-linha"]);
  });
});
