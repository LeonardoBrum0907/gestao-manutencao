import type { ChamadoShift, RecordPriority, RecordStatus } from "@manutencao/shared";
import { demoMoment } from "./demo-calendar";
import { demoMachines, type DemoCatalog, type DemoPlacedMachine } from "./demo-catalog";
import { techniciansOfShift, type DemoPeople } from "./demo-people";
import type { DemoRandom } from "./demo-random";

export type DemoChamadoTask = { body: string; dueInDays: number; member: string; priority: RecordPriority };
export type DemoChamado = {
  body: string;
  shift: ChamadoShift;
  openedAt: Date;
  closedAt: Date | null;
  status: RecordStatus;
  line: string;
  machine: string;
  members: string[];
  notes: string | null;
  task: DemoChamadoTask | null;
};

const CHAMADO_DAYS = 60;
const SHIFT_START_HOUR: Record<ChamadoShift, [number, number]> = { first: [6, 12], second: [14, 20], third: [22, 23] };
const SHIFTS: ChamadoShift[] = ["first", "second", "third"];

const STOP_REASONS = [
  "Parou com o Alarme 1 no Subconjunto 1",
  "Travamento no Subconjunto 2 · Transporte",
  "Falha de selagem no Subconjunto 3",
  "Sensor do Subconjunto 2 sem leitura",
  "Painel elétrico desarmou (Alarme 3)",
  "Ajuste de formato depois da troca de lote",
  "Vazamento de ar no cilindro do Subconjunto 1",
  "Ruído alto no Subconjunto 2",
  "Peça 1 quebrada no Subconjunto 3",
];

/**
 * Chamados dos últimos 60 dias, de 0 a 2 por dia, com turno, máquina, técnicos do turno e duração.
 * Os dois de hoje ficam abertos; alguns antigos geraram uma pendência.
 * @example demoChamados(new Date(), demoRandom(1), demoCatalog(), demoPeople()).length // ~60
 */
export function demoChamados(now: Date, random: DemoRandom, catalog: DemoCatalog, people: DemoPeople): DemoChamado[] {
  const past = Array.from({ length: CHAMADO_DAYS }, (_, index) => index + 1).flatMap((daysAgo) =>
    Array.from({ length: random.int(0, 2) }, () => closedChamado(now, daysAgo, random, catalog, people)),
  );
  return [...past, openChamado(now, 40, "open", random, catalog, people), openChamado(now, 150, "in_progress", random, catalog, people)];
}

function closedChamado(now: Date, daysAgo: number, random: DemoRandom, catalog: DemoCatalog, people: DemoPeople): DemoChamado {
  const shift = random.pick(SHIFTS);
  const [first, last] = SHIFT_START_HOUR[shift];
  const openedAt = demoMoment(now, daysAgo, random.int(first, last), random.pick([0, 10, 20, 30, 40, 50]));
  const closedAt = new Date(openedAt.getTime() + random.int(3, 30) * 5 * 60_000);
  const machine = random.pick(demoMachines(catalog));
  const base = baseChamado(shift, openedAt, machine, random, people);
  return { ...base, closedAt, status: "done", task: random.chance(0.15) ? followUp(machine.name, base.members[0], random) : null };
}

// Aberto há `minutesAgo` minutos: sempre no passado, a qualquer hora que a carga rodar.
function openChamado(now: Date, minutesAgo: number, status: RecordStatus, random: DemoRandom, catalog: DemoCatalog, people: DemoPeople): DemoChamado {
  const openedAt = new Date(now.getTime() - minutesAgo * 60_000);
  const machine = random.pick(demoMachines(catalog));
  return { ...baseChamado(random.pick(SHIFTS), openedAt, machine, random, people), closedAt: null, status, task: null };
}

type BaseChamado = Omit<DemoChamado, "closedAt" | "status" | "task">;

function baseChamado(shift: ChamadoShift, openedAt: Date, machine: DemoPlacedMachine, random: DemoRandom, people: DemoPeople): BaseChamado {
  const team = techniciansOfShift(people, shift).filter((person) => person.status === "active");
  const members = [random.pick(team).key];
  if (random.chance(0.3)) members.push(random.pick(team).key);
  return {
    body: `${machine.name}: ${random.pick(STOP_REASONS)}`,
    shift,
    openedAt,
    line: machine.line,
    machine: machine.key,
    members: [...new Set(members)],
    notes: random.chance(0.3) ? "Máquina liberada depois do teste com a produção." : null,
  };
}

const FOLLOW_UPS = ["Trocar a Peça 1 de vez", "Comprar peça reserva", "Revisar o ajuste com a produção"];

// A pendência gerada do chamado vence nos próximos dias: o Meu Dia já tem as atrasadas de propósito.
function followUp(machineName: string, member: string, random: DemoRandom): DemoChamadoTask {
  return { body: `${random.pick(FOLLOW_UPS)} da ${machineName}`, dueInDays: random.int(1, 10), member, priority: random.pick(["medium", "high"] as const) };
}
