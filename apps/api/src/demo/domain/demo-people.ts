import type { ChamadoShift, MemberStatus } from "@manutencao/shared";

// Equipe da demonstração: Supervisor 1 a 3 e Colaborador 1 a 12, nada de nome de gente real.

export type DemoRoleName = "mecânico" | "eletricista" | "Supervisor";
export type DemoTeam = { key: string; name: string; shift: ChamadoShift; supervisor: string };
export type DemoPerson = {
  key: string;
  name: string;
  role: DemoRoleName;
  shift: ChamadoShift;
  team: string | null;
  // Grau pela ordem do cadastro de partida (Júnior, Pleno, Sênior, Especialista); nulo no supervisor.
  gradeIndex: number | null;
  registration: string;
  status: MemberStatus;
};
export type DemoPeople = { teams: DemoTeam[]; people: DemoPerson[] };

const SHIFTS: { shift: ChamadoShift; label: string }[] = [
  { shift: "first", label: "1º turno" },
  { shift: "second", label: "2º turno" },
  { shift: "third", label: "3º turno" },
];
const PEOPLE_PER_TEAM = 4;
const GRADE_COUNT = 4;

/**
 * Três equipes, uma por turno, cada uma com um supervisor e quatro técnicos (mecânico e eletricista alternados).
 * @example demoPeople().people.find((person) => person.key === "c5") // { name: "Colaborador 5", team: "t2", shift: "second", … }
 */
export function demoPeople(): DemoPeople {
  const teams = SHIFTS.map(({ shift, label }, index) => ({ key: `t${index + 1}`, name: `Equipe ${label}`, shift, supervisor: `s${index + 1}` }));
  const supervisors = teams.map((team, index) => supervisorOf(team, index));
  const technicians = teams.flatMap((team, teamIndex) =>
    Array.from({ length: PEOPLE_PER_TEAM }, (_, slot) => technicianOf(team, teamIndex * PEOPLE_PER_TEAM + slot + 1)),
  );
  return { teams, people: [...supervisors, ...technicians] };
}

function supervisorOf(team: DemoTeam, index: number): DemoPerson {
  const number = index + 1;
  return { key: team.supervisor, name: `Supervisor ${number}`, role: "Supervisor", shift: team.shift, team: null, gradeIndex: null, registration: `S00${number}`, status: "active" };
}

// O último colaborador está de férias, para a tela mostrar esse status também.
function technicianOf(team: DemoTeam, number: number): DemoPerson {
  return {
    key: `c${number}`,
    name: `Colaborador ${number}`,
    role: number % 2 === 1 ? "mecânico" : "eletricista",
    shift: team.shift,
    team: team.key,
    gradeIndex: (number - 1) % GRADE_COUNT,
    registration: String(number).padStart(4, "0"),
    status: number === SHIFTS.length * PEOPLE_PER_TEAM ? "vacation" : "active",
  };
}

/**
 * Técnicos de um turno (os que entram nos chamados daquele turno).
 * @example techniciansOfShift(demoPeople(), "first").map((person) => person.key) // ["c1", "c2", "c3", "c4"]
 */
export function techniciansOfShift(people: DemoPeople, shift: ChamadoShift): DemoPerson[] {
  return people.people.filter((person) => person.role !== "Supervisor" && person.shift === shift);
}
