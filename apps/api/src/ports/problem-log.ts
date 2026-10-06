import type { RecordDto, RecordOrigin, RecordStatus } from "@manutencao/shared";

export type ProblemWrite = {
  origin: Extract<RecordOrigin, "chamado" | "ocorrencia" | "rp">;
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
  // Quem substitui recebe o registro atual para montar a gravação: o adaptador o lê uma vez só.
  remove(id: string): Promise<void>;
  replace(id: string, build: (current: RecordDto) => ProblemWrite | Promise<ProblemWrite>): Promise<RecordDto>;
}

export const PROBLEM_LOG = Symbol("PROBLEM_LOG");
