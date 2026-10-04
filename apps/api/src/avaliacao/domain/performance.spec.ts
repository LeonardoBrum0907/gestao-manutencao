import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PerformanceEntryDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import {
  assertPerformanceEditable,
  currentYear,
  requireCompetency,
  requireQuarter,
  requireScore,
  requireYear,
  summarizePerformance,
} from "./performance";

function rejects(run: () => unknown, statusCode = 400) {
  assert.throws(run, (error: unknown) => error instanceof DomainError && error.statusCode === statusCode);
}

describe("avaliação de desempenho", () => {
  it("aceita só as notas do SIGEM e vazio para limpar", () => {
    assert.equal(requireScore(8), 8);
    assert.equal(requireScore(null), null);
    for (const value of [0, 5, 9, 11, "8"]) rejects(() => requireScore(value));
  });

  it("valida ano, trimestre e competência", () => {
    assert.equal(requireYear(2026), 2026);
    rejects(() => requireYear(1999));
    rejects(() => requireYear(2026.5));
    assert.equal(requireQuarter(4), 4);
    rejects(() => requireQuarter(5));
    assert.equal(requireCompetency("safety"), "safety");
    rejects(() => requireCompetency("seg"));
  });

  it("só técnico tem a avaliação editada", () => {
    assert.doesNotThrow(() => assertPerformanceEditable("technician"));
    rejects(() => assertPerformanceEditable("supervisor"), 409);
  });

  it("calcula as médias como o SIGEM, ignorando o que está vazio", () => {
    const entries: PerformanceEntryDto[] = [
      { competency: "safety", quarter: 1, score: 10 },
      { competency: "teamwork", quarter: 1, score: 6 },
      { competency: "safety", quarter: 2, score: 8 },
      { competency: "proactivity", quarter: 2, score: 4 },
      { competency: "communication", quarter: 2, score: 6 },
    ];
    const summary = summarizePerformance(entries);
    assert.deepEqual(summary.quarterAverages, [8, 6, null, null]);
    assert.equal(summary.average, 7);
    const safety = summary.competencyAverages.find((item) => item.competency === "safety");
    assert.deepEqual(safety, { competency: "safety", average: 9, quarters: 2 });
    assert.equal(summary.competencyAverages.find((item) => item.competency === "reports")?.average, null);
    assert.equal(summary.competencyAverages.length, 12);
  });

  it("sem nota nenhuma, a média do ano fica vazia", () => {
    assert.equal(summarizePerformance([]).average, null);
  });

  it("o ano corrente segue o fuso do gestor", () => {
    assert.equal(currentYear(new Date("2027-01-01T02:00:00Z")), 2026);
    assert.equal(currentYear(new Date("2027-01-01T04:00:00Z")), 2027);
  });
});
