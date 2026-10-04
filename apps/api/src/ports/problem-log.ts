import type { RecordDto, RecordOrigin, RecordStatus } from "@manutencao/shared";

export type ProblemWrite = {
  origin: Extract<RecordOrigin, "chamado" | "ocorrencia">;
  body: string;
  occurredAt: Date;
  status: RecordStatus;
  memberIds: string[];
  factoryId: string | null;
  machineId: string | null;
  machineLabel: string | null;
  line: string | null;
  notes: string | null;
  dayNumber: number | null;
  openedAt: Date | null;
  closedAt: Date | null;
  durationMin: number | null;
};

export interface ProblemLogPort {
  save(write: ProblemWrite): Promise<RecordDto>;
  replace(id: string, write: ProblemWrite): Promise<RecordDto>;
  find(id: string): Promise<RecordDto | null>;
}

export const PROBLEM_LOG = Symbol("PROBLEM_LOG");
