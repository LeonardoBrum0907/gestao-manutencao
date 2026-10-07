import type {
  FeedbackTone,
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
  memberId: string | null;
  factoryId: string | null;
  lineId: string | null;
  lineLabel: string | null;
  tag: string | null;
  line: string | null;
  priority: RecordPriority | null;
  tone: FeedbackTone | null;
  dueAt: Date | null;
  notes: string | null;
  origin: RecordOrigin;
  dayNumber: number | null;
  openedAt: Date | null;
  closedAt: Date | null;
  durationMin: number | null;
  memberIds: string[];
};

export type CaptureInput = {
  type: RecordType;
  body: string;
  occurredAt: Date;
  memberId: string | null;
  tone: FeedbackTone | null;
};

export type TaskSheetInput = {
  body: string;
  occurredAt: Date;
  status: RecordStatus;
  memberId: string | null;
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
  memberId: string | null;
  tone: FeedbackTone | null;
};

export type ProblemSheetInput = {
  body: string;
  occurredAt: Date;
  memberId: string | null;
  lineId: string | null;
  lineLabel: string | null;
  notes: string | null;
};
