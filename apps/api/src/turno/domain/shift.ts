import type { RecordStatus } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import type { ProblemWrite } from "../../ports/problem-log";

export type ChamadoInput = {
  dayNumber: number;
  body: string;
  openedAt: Date | null;
  closedAt: Date | null;
  durationMin: number | null;
  memberIds: string[];
  machineId: string | null;
  machineLabel: string | null;
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

function place(machineId: string | null, machineLabel: string | null): { machineId: string | null; machineLabel: string | null } {
  const label = machineLabel?.trim() ?? "";
  const hasMachine = Boolean(machineId);
  const hasLabel = label.length > 0;
  if (hasMachine && hasLabel) {
    throw new DomainError("machine_conflict", 400, "Escolha a máquina cadastrada ou descreva outra, não as duas.");
  }
  return { machineId: hasMachine ? machineId : null, machineLabel: hasLabel ? label : null };
}

function durationOf(openedAt: Date | null, closedAt: Date | null, durationMin: number | null): number | null {
  if (openedAt && closedAt && closedAt.getTime() < openedAt.getTime()) {
    throw new DomainError("hours", 400, "O fechamento não pode ser antes da abertura.");
  }
  if (durationMin !== null) {
    if (!Number.isInteger(durationMin) || durationMin < 0) {
      throw new DomainError("duration", 400, "Duração inválida.");
    }
    return durationMin;
  }
  if (openedAt && closedAt) {
    return Math.round((closedAt.getTime() - openedAt.getTime()) / 60000);
  }
  return null;
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

export function openChamado(input: ChamadoInput, now: Date): ProblemWrite {
  if (!Number.isInteger(input.dayNumber) || input.dayNumber < 1) {
    throw new DomainError("day_number", 400, "Informe o número do dia.");
  }
  const spot = place(input.machineId, input.machineLabel);
  const openedAt = input.openedAt;
  return {
    origin: "chamado",
    body: text(input.body, "Escreva a descrição do chamado."),
    occurredAt: openedAt ?? now,
    status: input.status,
    memberIds: people(input.memberIds),
    factoryId: null,
    machineId: spot.machineId,
    machineLabel: spot.machineLabel,
    line: null,
    notes: input.notes?.trim() || null,
    dayNumber: input.dayNumber,
    openedAt,
    closedAt: input.closedAt,
    durationMin: durationOf(openedAt, input.closedAt, input.durationMin),
  };
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
    machineId: null,
    machineLabel: null,
    line: text(input.line, "Informe a linha."),
    notes: null,
    dayNumber: null,
    openedAt: null,
    closedAt: null,
    durationMin: null,
  };
}
