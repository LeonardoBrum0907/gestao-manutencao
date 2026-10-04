export const RECORD_TYPES = ["task", "feedback", "problem"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const RECORD_STATUSES = ["open", "in_progress", "done"] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

export const RECORD_PRIORITIES = ["low", "medium", "high"] as const;
export type RecordPriority = (typeof RECORD_PRIORITIES)[number];

export const RECORD_ORIGINS = ["inbox", "chamado", "ocorrencia"] as const;
export type RecordOrigin = (typeof RECORD_ORIGINS)[number];

export const MACHINE_STATUSES = [
  "implanting",
  "testing",
  "adjusting",
  "released",
  "stopped",
  "finished",
] as const;
export type MachineOperationalStatus = (typeof MACHINE_STATUSES)[number];

export const MEMBER_SHIFTS = ["first", "second", "third", "administrative"] as const;
export type MemberShift = (typeof MEMBER_SHIFTS)[number];

export const MEMBER_STATUSES = ["active", "inactive", "vacation", "away"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_ROLES = [
  "mecânico",
  "eletricista",
  "automação",
  "instrumentação",
  "manutenção",
  "utilidades",
] as const;
export type MemberRoleName = (typeof MEMBER_ROLES)[number];

export const RECORD_TYPE_LABELS: Record<RecordType, { short: string; gestor: string }> = {
  task: { short: "Tarefa", gestor: "Pendências do dia a dia" },
  feedback: { short: "Feedback", gestor: "Pessoas" },
  problem: { short: "Problema", gestor: "Pendências Preventivas" },
};

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  done: "Concluído",
};

export const RECORD_ORIGIN_LABELS: Record<RecordOrigin, string> = {
  inbox: "Captura",
  chamado: "Chamado",
  ocorrencia: "Ocorrência",
};

export const RECORD_PRIORITY_LABELS: Record<RecordPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export const GESTOR_TIME_ZONE = "America/Sao_Paulo";

export const DUE_WINDOWS = ["overdue", "today", "tomorrow"] as const;
export type DueWindow = (typeof DUE_WINDOWS)[number];

export const DUE_WINDOW_LABELS: Record<DueWindow, string> = {
  overdue: "Vencida",
  today: "Hoje",
  tomorrow: "Amanhã",
};

export function isDueWindow(value: string): value is DueWindow {
  return (DUE_WINDOWS as readonly string[]).includes(value);
}

export const MACHINE_STATUS_LABELS: Record<MachineOperationalStatus, string> = {
  implanting: "Em Implantação",
  testing: "Em Teste",
  adjusting: "Em Ajuste",
  released: "Liberada",
  stopped: "Parada",
  finished: "Finalizada",
};

export const MEMBER_SHIFT_LABELS: Record<MemberShift, string> = {
  first: "1º turno",
  second: "2º turno",
  third: "3º turno",
  administrative: "Administrativo",
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  vacation: "Férias",
  away: "Afastado",
};

export function isRecordType(value: string): value is RecordType {
  return (RECORD_TYPES as readonly string[]).includes(value);
}

export function isRecordOrigin(value: string): value is RecordOrigin {
  return (RECORD_ORIGINS as readonly string[]).includes(value);
}

export function isRecordStatus(value: string): value is RecordStatus {
  return (RECORD_STATUSES as readonly string[]).includes(value);
}

export function isRecordPriority(value: string): value is RecordPriority {
  return (RECORD_PRIORITIES as readonly string[]).includes(value);
}

export function isMachineStatus(value: string): value is MachineOperationalStatus {
  return (MACHINE_STATUSES as readonly string[]).includes(value);
}

export function isMemberShift(value: string): value is MemberShift {
  return (MEMBER_SHIFTS as readonly string[]).includes(value);
}

export function isMemberStatus(value: string): value is MemberStatus {
  return (MEMBER_STATUSES as readonly string[]).includes(value);
}

export type FactoryDto = {
  id: string;
  name: string;
};

export type MachineDto = {
  id: string;
  name: string;
  factoryId: string;
  sector: string | null;
  manufacturer: string | null;
  internalCode: string | null;
  status: MachineOperationalStatus;
  notes: string | null;
  isDailyLine: boolean;
  isCritical: boolean;
};

export type MemberRoleDto = {
  id: string;
  name: string;
};

export type MemberGradeDto = {
  id: string;
  name: string;
};

export type MemberDto = {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  gradeId: string | null;
  gradeName: string | null;
  shift: MemberShift;
  area: string | null;
  status: MemberStatus;
  registration: string | null;
  contact: string | null;
  notes: string | null;
};

export type AttachmentDto = {
  id: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
};

export type RecordDto = {
  id: string;
  type: RecordType;
  body: string;
  occurredAt: string;
  status: RecordStatus;
  memberId: string | null;
  factoryId: string | null;
  machineId: string | null;
  machineLabel: string | null;
  tag: string | null;
  line: string | null;
  priority: RecordPriority | null;
  dueAt: string | null;
  notes: string | null;
  origin: RecordOrigin;
  dayNumber: number | null;
  openedAt: string | null;
  closedAt: string | null;
  durationMin: number | null;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
  attachments: AttachmentDto[];
};

export type SessionDto = {
  email: string;
};

export type DashboardRecentDto = {
  id: string;
  type: RecordType;
  body: string;
  occurredAt: string;
  status: RecordStatus;
};

export type DashboardRankDto = {
  id: string;
  name: string;
  openCount: number;
};

export type DashboardDto = {
  openCount: number;
  overdueCount: number;
  dueTodayCount: number;
  doneCount: number;
  machineCount: number;
  activeMemberCount: number;
  recent: DashboardRecentDto[];
  machineRanking: DashboardRankDto[];
  memberRanking: DashboardRankDto[];
};

export * from "./competency-matrix";

export const COMPETENCY_SCORES = [0, 1, 2, 3, 4] as const;
export type CompetencyScore = (typeof COMPETENCY_SCORES)[number];

export const COMPETENCY_SCORE_LABELS: Record<CompetencyScore, { label: string; hint: string }> = {
  0: { label: "Não apto", hint: "Não sabe executar a atividade, falta conhecimento." },
  1: { label: "Em treinamento", hint: "Conhece a teoria, falta o treinamento prático." },
  2: { label: "Treinado", hint: "Em desenvolvimento, com teoria e prática no nível básico." },
  3: { label: "Apto", hint: "Amplo conhecimento teórico e prático, executa bem feito." },
  4: { label: "Referência no tema", hint: "Consegue ensinar os demais e melhorar o processo." },
};

export type CompetencyEntryDto = {
  skillId: string;
  score: CompetencyScore | null;
  notApplicable: boolean;
  expected: CompetencyScore | null;
};

export type CompetencySummaryDto = {
  applicable: number;
  scored: number;
  meets: number;
  below: number;
  unscored: number;
  notApplicable: number;
  average: number | null;
  adherence: number | null;
};

export type MemberMatrixDto = {
  memberId: string;
  equipments: string[];
  entries: CompetencyEntryDto[];
  summary: CompetencySummaryDto;
  byEquipment: (CompetencySummaryDto & { equipment: string })[];
};
