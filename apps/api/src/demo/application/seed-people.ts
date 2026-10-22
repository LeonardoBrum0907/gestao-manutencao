import type { MatrixCategory, MemberRoleDto } from "@manutencao/shared";
import type { DemoPeople, DemoPerson, DemoRoleName } from "../domain/demo-people";
import type { DemoIds, DemoServices } from "./demo-services";

// A função de cada pessoa: nome na tela, categoria da matriz e se lidera equipe.
const ROLE_SETUP: Record<DemoRoleName, { name: string; category: MatrixCategory | null; leadsTeams: boolean }> = {
  mecânico: { name: "Mecânico", category: "mechanical", leadsTeams: false },
  eletricista: { name: "Eletricista", category: "electrical", leadsTeams: false },
  Supervisor: { name: "Supervisor", category: null, leadsTeams: true },
};

/**
 * Funções, supervisores, equipes e técnicos. Os técnicos entram na lista da página pública de RPs.
 * Grava em `ids`: role, person e team.
 * @example await seedPeople(services, demoPeople(), ids)
 */
export async function seedPeople(services: DemoServices, people: DemoPeople, ids: DemoIds): Promise<void> {
  for (const role of Object.keys(ROLE_SETUP) as DemoRoleName[]) ids.set("role", role, await ensureRole(services, role));
  const grades = (await services.grades.list()).map((grade) => grade.id);
  const supervisors = people.people.filter((person) => person.role === "Supervisor");
  for (const person of supervisors) await seedPerson(services, person, grades, ids);
  for (const team of people.teams) {
    const created = await services.teams.create({ name: team.name, description: `Técnicos do ${team.name.replace("Equipe ", "")}`, supervisorId: ids.get("person", team.supervisor) });
    ids.set("team", team.key, created.id);
  }
  for (const person of people.people.filter((item) => item.role !== "Supervisor")) {
    await seedPerson(services, person, grades, ids);
    await services.rpReviews.setMemberPublicRp(ids.get("person", person.key), { enabled: true });
  }
}

// O banco novo já traz "Supervisor" (migração); as outras funções nascem aqui.
async function ensureRole(services: DemoServices, role: DemoRoleName): Promise<string> {
  const setup = ROLE_SETUP[role];
  const existing = (await services.roles.list()).find((item: MemberRoleDto) => item.name.toLocaleLowerCase("pt-BR") === setup.name.toLocaleLowerCase("pt-BR"));
  const { id } = existing ?? (await services.roles.create({ name: setup.name }));
  await services.roles.setMatrixCategory(id, { category: setup.category });
  await services.roles.setLeadsTeams(id, { leadsTeams: setup.leadsTeams });
  return id;
}

async function seedPerson(services: DemoServices, person: DemoPerson, grades: string[], ids: DemoIds): Promise<void> {
  const created = await services.members.create({
    name: person.name,
    roleId: ids.get("role", person.role),
    gradeId: person.gradeIndex === null ? null : grades[person.gradeIndex] ?? null,
    teamId: ids.optional("team", person.team),
    shift: person.shift,
    status: person.status,
    registration: person.registration,
  });
  ids.set("person", person.key, created.id);
}
