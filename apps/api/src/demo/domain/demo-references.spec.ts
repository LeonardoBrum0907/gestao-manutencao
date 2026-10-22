import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEMO_SUBASSEMBLIES, demoCatalog, demoMachines } from "./demo-catalog";
import { DEMO_POST_PREVENTIVES, DEMO_TECH_CARDS } from "./demo-knowledge";
import { demoPeople } from "./demo-people";
import { DEMO_ENTRIES, DEMO_FEEDBACKS, DEMO_PROBLEMS, DEMO_TASKS } from "./demo-records";
import { DEMO_RPS, demoRpCauses } from "./demo-rps";

// As listas fixas citam máquinas, pessoas e subconjuntos por chave: uma chave errada só apareceria
// na hora da carga na VPS. Aqui ela falha antes.
describe("referências dos dados fixos da demonstração", () => {
  const catalog = demoCatalog();
  const people = new Set(demoPeople().people.map((person) => person.key));
  const machines = new Map(demoMachines(catalog).map((machine) => [machine.key, machine.line]));
  const models = new Set(catalog.models.map((model) => model.key));
  const subassemblies = new Set<string>(DEMO_SUBASSEMBLIES);

  it("pendências e feedbacks citam pessoas cadastradas", () => {
    const members = [...DEMO_TASKS.map((task) => task.member), ...DEMO_FEEDBACKS.map((feedback) => feedback.member)];
    assert.ok(members.every((member) => member === null || people.has(member)));
    assert.ok(DEMO_TASKS.every((task) => task.doneDaysAgo === null || task.doneDaysAgo <= task.daysAgo));
  });

  it("problemas citam a máquina dentro da linha certa", () => {
    for (const problem of DEMO_PROBLEMS) {
      assert.equal(machines.get(problem.machine), problem.line, problem.body);
      assert.ok(subassemblies.has(problem.subassembly));
    }
  });

  it("RPs têm ordem única, máquina, subconjunto e técnicos cadastrados", () => {
    assert.equal(new Set(DEMO_RPS.map((rp) => rp.orderNumber)).size, DEMO_RPS.length);
    for (const rp of DEMO_RPS) {
      assert.ok(machines.has(rp.machine) && subassemblies.has(rp.subassembly), rp.problem);
      assert.ok(rp.members.every((member) => people.has(member)), rp.problem);
      assert.ok(rp.channel === "public" || rp.review === null, `${rp.orderNumber}: só RP da página pública tem decisão`);
    }
  });

  it("pós-preventivas apontam para RPs que existem", () => {
    const orders = new Set(DEMO_RPS.map((rp) => rp.orderNumber));
    for (const item of DEMO_POST_PREVENTIVES) {
      assert.ok(machines.has(item.machine) && item.members.every((member) => people.has(member)));
      assert.ok(item.rpOrder === null || orders.has(item.rpOrder));
      assert.ok(item.occurrenceDaysAgo < item.preventiveDaysAgo, "a ocorrência vem depois da preventiva");
    }
  });

  it("fichas técnicas usam modelos e subconjuntos da demonstração", () => {
    assert.ok(DEMO_TECH_CARDS.every((card) => models.has(card.model) && (card.subassembly === null || subassemblies.has(card.subassembly))));
  });

  it("marca no RP só os 4M que têm texto", () => {
    const causes = demoRpCauses({ machine: "Guia solta." });
    assert.deepEqual(causes.machine, { marked: true, text: "Guia solta." });
    assert.deepEqual(causes.labor, { marked: false, text: null });
  });

  it("não traz nome de fabricante nem de linha real", () => {
    const everything = JSON.stringify([catalog, demoPeople(), DEMO_TASKS, DEMO_FEEDBACKS, DEMO_PROBLEMS, DEMO_ENTRIES, DEMO_RPS, DEMO_POST_PREVENTIVES, DEMO_TECH_CARDS]);
    for (const real of ["Uhlmann", "Mediseal", "CAM", "MED ", "Blistadeira", "Encartuchadeira", "Encaixotadora"]) {
      assert.ok(!everything.includes(real), `os dados da demonstração citam "${real}"`);
    }
  });
});
