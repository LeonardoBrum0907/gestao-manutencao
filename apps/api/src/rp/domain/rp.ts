import type { RecordStatus, RpFields, RpStatus } from "@manutencao/shared";
import type { ProblemWrite } from "../../ports/problem-log";
import { plain } from "./rp-match";

// O Problema espelho acompanha o status do RP: corrigido ou produzindo fecha, monitoramento segue em andamento.
export function problemStatus(status: RpStatus): RecordStatus {
  if (status === "corrected" || status === "producing") return "done";
  if (status === "monitoring") return "in_progress";
  return "open";
}

export function mirrorProblem(rp: RpFields, occurredAt: Date): ProblemWrite {
  return {
    origin: "rp",
    body: rp.problem,
    occurredAt,
    status: problemStatus(rp.status),
    memberIds: rp.memberIds,
    factoryId: rp.factoryId,
    lineId: rp.lineId,
    lineLabel: rp.lineId ? null : [rp.line, rp.tag].filter(Boolean).join(" · ") || null,
    line: rp.line,
    notes: null,
    dayNumber: null,
    openedAt: null,
    closedAt: null,
    durationMin: null,
  };
}

export function normalizeOrder(order: string | null): string | null {
  const value = order ? order.replace(/[^a-z0-9]/gi, "").toLowerCase() : "";
  return value || null;
}

export function normalizeProblem(problem: string): string {
  return plain(problem).replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Meio-dia UTC: a data do relatório não muda de dia em nenhum fuso do Brasil.
export function rpDate(day: string): Date {
  return new Date(`${day}T12:00:00.000Z`);
}
