import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MatrixSkillDto } from "@manutencao/shared";
import { evolutionOf, isStale, lastProgressAt, scoresAt, type ScoreChange } from "./transfer-timeline";

const skill = (id: string): MatrixSkillDto => ({ id, equipmentId: "e1", subgroup: "A", text: id, level: "basic", archived: false });
const change = (skillId: string, score: number | null, when: string): ScoreChange => ({ skillId, score, notApplicable: false, changedAt: new Date(when) });

const history = [
  change("s1", 2, "2026-07-01T12:00:00Z"),
  change("s1", 3, "2026-08-15T12:00:00Z"),
  change("s2", 3, "2026-09-20T12:00:00Z"),
  change("s3", 4, "2026-10-01T12:00:00Z"),
];

describe("scoresAt", () => {
  it("usa a última mudança até o instante", () => {
    assert.equal(scoresAt(history, new Date("2026-08-01T00:00:00Z")).get("s1")?.score, 2);
    assert.equal(scoresAt(history, new Date("2026-09-01T00:00:00Z")).get("s1")?.score, 3);
    assert.equal(scoresAt(history, new Date("2026-06-01T00:00:00Z")).get("s1"), undefined);
  });
});

describe("evolutionOf", () => {
  const mastered = [skill("s1"), skill("s2")];

  it("início, cada mês e hoje", () => {
    const points = evolutionOf(mastered, history, new Date("2026-08-10T15:00:00Z"), new Date("2026-10-12T15:00:00Z"));
    assert.deepEqual(points, [
      { date: "2026-08-10", percent: 0 },
      { date: "2026-09-01", percent: 50 },
      { date: "2026-10-01", percent: 100 },
      { date: "2026-10-12", percent: 100 },
    ]);
  });

  it("começo na noite do último dia do mês ainda ganha o dia 1 seguinte", () => {
    const points = evolutionOf(mastered, history, new Date("2026-09-01T01:00:00Z"), new Date("2026-09-10T15:00:00Z"));
    assert.deepEqual(points.map((point) => point.date), ["2026-08-31", "2026-09-01", "2026-09-10"]);
  });

  it("no máximo 12 pontos, os mais recentes", () => {
    const points = evolutionOf(mastered, history, new Date("2024-01-10T15:00:00Z"), new Date("2026-10-12T15:00:00Z"));
    assert.equal(points.length, 12);
    assert.equal(points.at(-1)?.date, "2026-10-12");
  });

  it("repasse aberto hoje tem um ponto só", () => {
    const now = new Date("2026-10-12T15:00:00Z");
    assert.equal(evolutionOf(mastered, history, now, now).length, 1);
    assert.equal(evolutionOf(mastered, history, new Date("2026-10-12T11:00:00Z"), now).length, 1);
  });
});

describe("lastProgressAt", () => {
  const startedAt = new Date("2026-08-10T00:00:00Z");

  it("última mudança numa habilidade do repasse depois do início", () => {
    assert.equal(lastProgressAt(new Set(["s1", "s2"]), history, startedAt).toISOString(), "2026-09-20T12:00:00.000Z");
  });

  it("sem mudança depois do início, o próprio início", () => {
    assert.equal(lastProgressAt(new Set(["s9"]), history, startedAt), startedAt);
  });
});

describe("isStale", () => {
  const now = new Date("2026-10-12T00:00:00Z");

  it("mais de 60 dias sem nota nova num repasse em andamento", () => {
    assert.equal(isStale(new Date("2026-08-12T00:00:00Z"), now, "active"), true);
    assert.equal(isStale(new Date("2026-08-14T00:00:00Z"), now, "active"), false);
  });

  it("encerrado nunca fica parado", () => {
    assert.equal(isStale(new Date("2026-01-01T00:00:00Z"), now, "closed"), false);
  });
});
