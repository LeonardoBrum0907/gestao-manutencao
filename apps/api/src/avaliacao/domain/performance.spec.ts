import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PerformanceEntryDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import {
  assertPerformanceEditable,
  currentYear,
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

  it("valida ano e trimestre", () => {
    assert.equal(requireYear(2026), 2026);
    rejects(() => requireYear(1999));
    rejects(() => requireYear(2026.5));
    assert.equal(requireQuarter(4), 4);
    rejects(() => requireQuarter(5));
  });

  it("só técnico tem a avaliação editada", () => {
    assert.doesNotThrow(() => assertPerformanceEditable("technician"));
    rejects(() => assertPerformanceEditable("supervisor"), 409);
  });

  it("calcula as médias como o SIGEM, ignorando o que está vazio", () => {
    const entries: PerformanceEntryDto[] = [
      { competencyId: "safety", quarter: 1, score: 10 },
      { competencyId: "teamwork", quarter: 1, score: 6 },
      { competencyId: "safety", quarter: 2, score: 8 },
      { competencyId: "proactivity", quarter: 2, score: 4 },
      { competencyId: "communication", quarter: 2, score: 6 },
    ];
    const rows = ["safety", "teamwork", "proactivity", "reports", "communication"];
    const summary = summarizePerformance(entries, rows);
    assert.deepEqual(summary.quarterAverages, [8, 6, null, null]);
    assert.equal(summary.average, 7);
    const safety = summary.competencyAverages.find((item) => item.competencyId === "safety");
    assert.deepEqual(safety, { competencyId: "safety", average: 9, quarters: 2 });
    assert.equal(summary.competencyAverages.find((item) => item.competencyId === "reports")?.average, null);
    assert.deepEqual(
      summary.competencyAverages.map((item) => item.competencyId),
      rows,
    );
  });

  it("sem nota nenhuma, a média do ano fica vazia", () => {
    assert.equal(summarizePerformance([], ["safety"]).average, null);
  });

  it("o ano corrente segue o fuso do gestor", () => {
    assert.equal(currentYear(new Date("2027-01-01T02:00:00Z")), 2026);
    assert.equal(currentYear(new Date("2027-01-01T04:00:00Z")), 2027);
  });
});
