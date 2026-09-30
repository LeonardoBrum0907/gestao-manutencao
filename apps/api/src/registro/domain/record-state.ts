import type {
  RecordOrigin,
  RecordPriority,
  RecordStatus,
  RecordType,
} from "@manutencao/shared";

export type RecordState = {
  type: RecordType;
  body: string;
  occurredAt: Date;
  status: RecordStatus;
  technicianId: string | null;
  factoryId: string | null;
  machineId: string | null;
  machineLabel: string | null;
  tag: string | null;
  line: string | null;
  priority: RecordPriority | null;
  dueAt: Date | null;
  notes: string | null;
  origin: RecordOrigin;
};

export type CaptureInput = {
  type: RecordType;
  body: string;
  occurredAt: Date;
  technicianId: string | null;
};

export type TaskSheetInput = {
  body: string;
  occurredAt: Date;
  status: RecordStatus;
  technicianId: string | null;
  factoryId: string | null;
  tag: string | null;
  line: string | null;
  priority: RecordPriority | null;
  dueAt: Date | null;
  notes: string | null;
};

export type FeedbackSheetInput = {
  body: string;
  occurredAt: Date;
  technicianId: string | null;
};

export type ProblemSheetInput = {
  body: string;
  occurredAt: Date;
  technicianId: string | null;
  machineId: string | null;
  machineLabel: string | null;
  notes: string | null;
};
