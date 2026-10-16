import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_TEAM_MATRIX_LAYOUT } from "@manutencao/shared";
import { teamFixture } from "./team-fixture";
import { teamGrid } from "./team-grid";
import { teamMatrixTab, teamTrainingTab } from "./team-sheet";

describe("planilha da Matriz da equipe", () => {
  const team = teamFixture();
  const grid = teamGrid(team, { layout: DEFAULT_TEAM_MATRIX_LAYOUT, shift: "", focus: null, lineIds: [], memberIds: [], sort: { key: "name", dir: 1 } });
  const tab = teamMatrixTab(team, grid, "training", "12/10/2026");

  it("repete a grade da tela: linhas em cima, máquinas, e as mesmas colunas em todas as fileiras", () => {
    const [blocks, titles] = tab.rows.slice(3, 5);
    assert.deepEqual(blocks.map((cell) => [cell.value, cell.span]), [["", 1], ["CAM 05", 2], ["CAM 08", 1], ["Sem máquina cadastrada", 1], ["", 1]]);
    assert.deepEqual(titles.map((cell) => cell.value), ["Eletricista", "Blistadeira (Blistadeira CAM)", "Encartuchadeira (Encartuchadeira CAM)", "Blistadeira CAM", "Encaixotadora CAM", "Qualificado em"]);
    assert.equal(tab.frozenRows, 6);
    assert.equal(tab.widths.length, titles.length);
  });

  it("nota em fração para o formato de %, com o tom de perto do corte", () => {
    const caio = tab.rows.find((row) => row[0]?.value === "Caio");
    assert.deepEqual(caio?.[4], { value: 0.75, percent: true, tone: "near" });
    assert.deepEqual(caio?.[2], { value: null });
  });

  it("diz a categoria filtrada no cabeçalho", () => {
    assert.match(String(teamMatrixTab(team, grid, "training", "12/10/2026", "electrical").rows[1][0].value), /Visão: Treino · Só Eletricista/);
    assert.doesNotMatch(String(tab.rows[1][0].value), /Só/);
  });

  it("lista quem treinar, com uma linha avisando quando ninguém tem o equipamento", () => {
    const rows = teamTrainingTab(team).rows;
    assert.equal(rows[1][0].value, "Encaixotadora CAM");
    assert.equal(rows[1][4].value, "Caio");
  });
});
