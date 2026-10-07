import type { ChamadoShift, RecordPriority, RecordStatus } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import type { ProblemWrite } from "../../ports/problem-log";

export type ChamadoInput = {
  body: string;
  openedAt: Date;
  closedAt: Date | null;
  shift: ChamadoShift | null;
  memberIds: string[];
  lineId: string | null;
  lineLabel: string | null;
  machineId: string | null;
  status: RecordStatus;
  notes: string | null;
};

// O que vai para o banco. O número do dia é dado na gravação, pelo dia da abertura.
export type ChamadoWrite = {
  body: string;
  occurredAt: Date;
  openedAt: Date;
  closedAt: Date | null;
  durationMin: number | null;
  shift: ChamadoShift | null;
  memberIds: string[];
  lineId: string | null;
  lineLabel: string | null;
  machineId: string | null;
  status: RecordStatus;
  notes: string | null;
};

export type OcorrenciaInput = {
  factoryId: string;
  line: string;
  body: string;
};

function text(value: string, message: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new DomainError("empty_body", 400, message);
  return trimmed;
}

function place(lineId: string | null, lineLabel: string | null): { lineId: string | null; lineLabel: string | null } {
  const label = lineLabel?.trim() ?? "";
  const hasLine = Boolean(lineId);
  const hasLabel = label.length > 0;
  if (hasLine && hasLabel) {
    throw new DomainError("line_conflict", 400, "Escolha a linha cadastrada ou descreva outra, não as duas.");
  }
  return { lineId: hasLine ? lineId : null, lineLabel: hasLabel ? label : null };
}

function durationOf(openedAt: Date, closedAt: Date | null): number | null {
  if (!closedAt) return null;
  if (closedAt.getTime() < openedAt.getTime()) {
    throw new DomainError("hours", 400, "O fechamento não pode ser antes da abertura.");
  }
  return Math.round((closedAt.getTime() - openedAt.getTime()) / 60000);
}

function people(ids: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    unique.push(trimmed);
  }
  return unique;
}

export function openChamado(input: ChamadoInput): ChamadoWrite {
  const spot = place(input.lineId, input.lineLabel);
  if (input.machineId && !spot.lineId) {
    throw new DomainError("machine", 400, "Escolha a linha da máquina.");
  }
  return {
    body: text(input.body, "Escreva o que aconteceu."),
    occurredAt: input.openedAt,
    openedAt: input.openedAt,
    closedAt: input.closedAt,
    durationMin: durationOf(input.openedAt, input.closedAt),
    shift: input.shift,
    memberIds: people(input.memberIds),
    lineId: spot.lineId,
    lineLabel: spot.lineLabel,
    machineId: input.machineId,
    status: input.status,
    notes: input.notes?.trim() || null,
  };
}

// Número do chamado no dia: o seguinte ao maior já usado (os antigos foram digitados à mão).
export function nextDayNumber(used: (number | null)[]): number {
  return used.reduce<number>((max, value) => (value !== null && value > max ? value : max), 0) + 1;
}

export type ChamadoTaskInput = {
  body: string;
  dueAt: Date;
  memberId: string | null;
  priority: RecordPriority | null;
};

export function chamadoTask(input: ChamadoTaskInput): ChamadoTaskInput {
  return { ...input, body: text(input.body, "Escreva o que falta fazer.") };
}

export function noteOcorrencia(input: OcorrenciaInput, occurredAt: Date): ProblemWrite {
  const factoryId = input.factoryId.trim();
  if (!factoryId) throw new DomainError("factory", 400, "Escolha a fábrica.");
  return {
    origin: "ocorrencia",
    body: text(input.body, "Escreva a ocorrência."),
    occurredAt,
    status: "open",
    memberIds: [],
    factoryId,
    lineId: null,
    lineLabel: null,
    line: text(input.line, "Informe a linha."),
    notes: null,
    dayNumber: null,
    openedAt: null,
    closedAt: null,
    durationMin: null,
  };
}
