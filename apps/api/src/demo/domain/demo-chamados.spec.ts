import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoCatalog } from "./demo-catalog";
import { demoChamados } from "./demo-chamados";
import { demoPeople, techniciansOfShift } from "./demo-people";
import { demoRandom } from "./demo-random";

describe("chamados da demonstração", () => {
  const now = new Date("2026-10-22T15:00:00Z");
  const people = demoPeople();
  const chamados = demoChamados(now, demoRandom(20261022), demoCatalog(), people);

  it("deixa só os dois últimos abertos, ambos antes da hora da carga", () => {
    const open = chamados.filter((chamado) => chamado.closedAt === null);
    assert.deepEqual(open.map((chamado) => chamado.status), ["open", "in_progress"]);
    assert.ok(open.every((chamado) => chamado.openedAt < now));
  });

  it("fecha os antigos depois de abrir e dentro dos 60 dias", () => {
    const closed = chamados.filter((chamado) => chamado.closedAt !== null);
    const oldest = now.getTime() - 61 * 86_400_000;
    assert.ok(closed.every((chamado) => chamado.status === "done" && chamado.closedAt! > chamado.openedAt));
    assert.ok(closed.every((chamado) => chamado.openedAt.getTime() > oldest && chamado.openedAt < now));
  });

  it("só chama técnicos ativos do turno do chamado", () => {
    for (const chamado of chamados) {
      const shiftKeys = techniciansOfShift(people, chamado.shift).filter((person) => person.status === "active").map((person) => person.key);
      assert.ok(chamado.members.every((member) => shiftKeys.includes(member)), `${chamado.body}: ${chamado.members.join(", ")}`);
    }
  });

  it("dá pendência com prazo no futuro a quem atendeu", () => {
    const tasks = chamados.filter((chamado) => chamado.task !== null);
    assert.ok(tasks.length > 0);
    assert.ok(tasks.every((chamado) => chamado.task!.dueInDays > 0 && chamado.members.includes(chamado.task!.member)));
  });

  it("repete os mesmos chamados com a mesma semente", () => {
    const again = demoChamados(now, demoRandom(20261022), demoCatalog(), people);
    assert.deepEqual(again, chamados);
  });
});
