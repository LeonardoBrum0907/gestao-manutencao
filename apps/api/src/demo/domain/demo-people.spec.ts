import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoPeople, techniciansOfShift } from "./demo-people";

describe("equipe da demonstração", () => {
  const people = demoPeople();

  it("tem três supervisores fora das equipes, cada um liderando uma", () => {
    const supervisors = people.people.filter((person) => person.role === "Supervisor");
    assert.deepEqual(supervisors.map((person) => person.name), ["Supervisor 1", "Supervisor 2", "Supervisor 3"]);
    assert.ok(supervisors.every((person) => person.team === null));
    assert.deepEqual(people.teams.map((team) => team.supervisor), ["s1", "s2", "s3"]);
  });

  it("tem quatro técnicos por turno, com matrícula única", () => {
    assert.deepEqual(techniciansOfShift(people, "second").map((person) => person.name), ["Colaborador 5", "Colaborador 6", "Colaborador 7", "Colaborador 8"]);
    const registrations = people.people.map((person) => person.registration);
    assert.equal(new Set(registrations).size, registrations.length);
  });

  it("deixa o último colaborador de férias", () => {
    assert.equal(people.people.find((person) => person.key === "c12")?.status, "vacation");
  });
});
