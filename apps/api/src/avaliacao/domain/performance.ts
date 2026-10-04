import {
  GESTOR_TIME_ZONE,
  isPerformanceScore,
  QUARTERS,
  type MemberPosition,
  type PerformanceEntryDto,
  type PerformanceScore,
  type Quarter,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export function requireYear(value: number): number {
  if (!Number.isInteger(value) || value < 2000 || value > 2100) throw new DomainError("invalid", 400, "Ano inválido.");
  return value;
}

export function requireQuarter(value: number): Quarter {
  const quarter = QUARTERS.find((item) => item === value);
  if (quarter === undefined) throw new DomainError("invalid", 400, "Trimestre inválido.");
  return quarter;
}

export function requireScore(value: unknown): PerformanceScore | null {
  if (value === null) return null;
  if (typeof value !== "number" || !isPerformanceScore(value)) {
    throw new DomainError("invalid", 400, "Nota inválida. Use 10, 8, 6, 4 ou 2.");
  }
  return value;
}

export function assertPerformanceEditable(position: MemberPosition): void {
  if (position !== "technician") {
    throw new DomainError("performance_technician_only", 409, "A avaliação de desempenho é só para técnico.");
  }
}

export function currentYear(now: Date, timeZone: string = GESTOR_TIME_ZONE): number {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric" }).format(now));
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

// Como no SIGEM: média de cada trimestre, média de cada competência nos trimestres avaliados,
// e a do ano é a média dos trimestres que têm nota. Uma média por linha do ano, na ordem recebida.
export function summarizePerformance(entries: PerformanceEntryDto[], competencyIds: string[]) {
  const quarterAverages = QUARTERS.map((quarter) =>
    average(entries.filter((entry) => entry.quarter === quarter).map((entry) => entry.score)),
  );
  const competencyAverages = competencyIds.map((competencyId) => {
    const scores = entries.filter((entry) => entry.competencyId === competencyId).map((entry) => entry.score);
    return { competencyId, average: average(scores), quarters: scores.length };
  });
  const rated = quarterAverages.filter((value): value is number => value !== null);
  return { quarterAverages, competencyAverages, average: average(rated) };
}
