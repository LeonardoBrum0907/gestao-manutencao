export const RECORD_TYPES = ["task", "feedback", "problem"] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const RECORD_STATUSES = ["open", "in_progress", "done"] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

export const FEEDBACK_TONES = ["positive", "negative", "neutral"] as const;
export type FeedbackTone = (typeof FEEDBACK_TONES)[number];

export const FEEDBACK_TONE_LABELS: Record<FeedbackTone, string> = {
  positive: "Positivo",
  negative: "Negativo",
  neutral: "Neutro",
};

export function isFeedbackTone(value: string): value is FeedbackTone {
  return (FEEDBACK_TONES as readonly string[]).includes(value);
}

export const RECORD_PRIORITIES = ["low", "medium", "high"] as const;
export type RecordPriority = (typeof RECORD_PRIORITIES)[number];

export const RECORD_ORIGINS = ["inbox", "chamado", "ocorrencia", "rp"] as const;
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

export const MEMBER_POSITIONS = ["technician", "supervisor"] as const;
export type MemberPosition = (typeof MEMBER_POSITIONS)[number];

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
  rp: "RP",
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

export const MEMBER_POSITION_LABELS: Record<MemberPosition, string> = {
  technician: "Técnico",
  supervisor: "Supervisor",
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

export function isMemberPosition(value: string): value is MemberPosition {
  return (MEMBER_POSITIONS as readonly string[]).includes(value);
}

export type FactoryDto = {
  id: string;
  name: string;
};

// Pergunta antes de excluir: se não dá, o motivo vem pronto para mostrar (o mesmo que a exclusão daria).
export type RemovalCheckDto = {
  canRemove: boolean;
  reason: string | null;
  // O que vai junto ou perde a ligação quando dá para excluir; a tela mostra antes de confirmar.
  warnings: string[];
};

export type LineDto = {
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

// Máquina (equipamento) de uma linha. O modelo é um equipamento do catálogo da matriz.
export type MachineDto = {
  id: string;
  lineId: string;
  equipmentId: string | null;
  name: string;
  tag: string | null;
  manufacturer: string | null;
  status: MachineOperationalStatus;
  notes: string | null;
};

// Subconjunto de um modelo de equipamento (vale para todas as máquinas desse modelo).
export type SubassemblyDto = {
  id: string;
  equipmentId: string;
  name: string;
  archived: boolean;
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
  position: MemberPosition;
  teamId: string | null;
  teamName: string | null;
  roleId: string | null;
  roleName: string | null;
  gradeId: string | null;
  gradeName: string | null;
  shift: MemberShift;
  area: string | null;
  status: MemberStatus;
  registration: string | null;
  contact: string | null;
  notes: string | null;
};

export type TeamDto = {
  id: string;
  name: string;
  description: string | null;
  supervisorId: string | null;
  supervisorName: string | null;
  memberIds: string[];
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
  lineId: string | null;
  lineLabel: string | null;
  tag: string | null;
  line: string | null;
  priority: RecordPriority | null;
  tone: FeedbackTone | null;
  dueAt: string | null;
  notes: string | null;
  origin: RecordOrigin;
  dayNumber: number | null;
  openedAt: string | null;
  closedAt: string | null;
  durationMin: number | null;
  memberIds: string[];
  // Tarefa gerada de um chamado: aponta para ele.
  chamadoId: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: AttachmentDto[];
};

// Comportamento (SIGEM: Por Técnico › Comportamento). Chaves estáveis, rótulos do SIGEM.
export const BEHAVIOR_RATINGS = ["excellent", "good", "regular", "poor"] as const;
export type BehaviorRating = (typeof BEHAVIOR_RATINGS)[number];

export const BEHAVIOR_RATING_LABELS: Record<BehaviorRating, string> = {
  excellent: "Excelente",
  good: "Boa",
  regular: "Regular",
  poor: "Ruim",
};

export const PRODUCTIVITY_LEVELS = ["high", "medium", "low"] as const;
export type ProductivityLevel = (typeof PRODUCTIVITY_LEVELS)[number];

export const PRODUCTIVITY_LEVEL_LABELS: Record<ProductivityLevel, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

// As três categorias são fixas; as opções dentro delas são cadastro do coordenador (Configurações › Avaliação).
export const BEHAVIOR_TAG_GROUPS = [
  { key: "strengths", label: "Pontos positivos" },
  { key: "attention", label: "Pontos de atenção" },
  { key: "situation", label: "Situação atual" },
] as const;

export type BehaviorTagGroup = (typeof BEHAVIOR_TAG_GROUPS)[number]["key"];

export function isBehaviorTagGroup(value: string): value is BehaviorTagGroup {
  return BEHAVIOR_TAG_GROUPS.some((group) => group.key === value);
}

// Arquivada some das opções da ficha, mas continua marcada em quem já tinha.
export type BehaviorTagDto = {
  id: string;
  group: BehaviorTagGroup;
  name: string;
  archived: boolean;
};

export function isBehaviorRating(value: string): value is BehaviorRating {
  return (BEHAVIOR_RATINGS as readonly string[]).includes(value);
}

export function isProductivityLevel(value: string): value is ProductivityLevel {
  return (PRODUCTIVITY_LEVELS as readonly string[]).includes(value);
}

export type MemberBehaviorDto = {
  memberId: string;
  punctuality: BehaviorRating | null;
  productivity: ProductivityLevel | null;
  collaboration: BehaviorRating | null;
  tags: string[];
};

// Avaliação de desempenho (SIGEM: Por Técnico › Avaliação de Desempenho): nota por competência e trimestre.
// As competências são cadastro do coordenador (as 12 do SIGEM entram como ponto de partida).
export type PerformanceCompetencyDto = {
  id: string;
  name: string;
  archived: boolean;
};

export const PERFORMANCE_SCORES = [10, 8, 6, 4, 2] as const;
export type PerformanceScore = (typeof PERFORMANCE_SCORES)[number];

export const PERFORMANCE_SCORE_LABELS: Record<PerformanceScore, string> = {
  10: "Excelente",
  8: "Muito bom",
  6: "Bom",
  4: "Regular",
  2: "Ruim",
};

export const QUARTERS = [1, 2, 3, 4] as const;
export type Quarter = (typeof QUARTERS)[number];

export function isPerformanceScore(value: number): value is PerformanceScore {
  return (PERFORMANCE_SCORES as readonly number[]).includes(value);
}

export type PerformanceEntryDto = {
  competencyId: string;
  quarter: Quarter;
  score: PerformanceScore;
};

export type MemberPerformanceDto = {
  memberId: string;
  year: number;
  // As linhas do ano: as competências ativas e as arquivadas que têm nota nesse ano, na ordem do cadastro.
  competencies: PerformanceCompetencyDto[];
  entries: PerformanceEntryDto[];
  quarterAverages: (number | null)[];
  competencyAverages: { competencyId: string; average: number | null; quarters: number }[];
  average: number | null;
  years: number[];
};

export type MemberPdiDto = {
  memberId: string;
  sponsorLineIds: string[];
  developmentLineIds: string[];
  attachments: AttachmentDto[];
};

export type MemberRecordSummaryDto = {
  open: number;
  overdue: number;
  done: number;
  chamados: number;
  feedbacks: number;
};

// O que a lista precisa para desenhar a linha: sem anexos, observações e técnicos do chamado.
export type RecordListItemDto = Pick<
  RecordDto,
  "id" | "type" | "body" | "occurredAt" | "status" | "origin" | "priority" | "tone" | "dueAt" | "lineId"
>;

// Lista paginada por cursor: nextCursor vem nulo na última página.
export type RecordPageDto = {
  items: RecordListItemDto[];
  nextCursor: string | null;
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

// Só o selo da barra lateral: uma contagem barata, em vez do painel inteiro a cada tela.
export type OverdueCountDto = {
  overdueCount: number;
};

export type DashboardDto = {
  openCount: number;
  overdueCount: number;
  dueTodayCount: number;
  doneCount: number;
  lineCount: number;
  activeMemberCount: number;
  recent: DashboardRecentDto[];
  lineRanking: DashboardRankDto[];
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
  // Atende = acima + igual ao esperado.
  meets: number;
  above: number;
  exact: number;
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

// RP (Relatório Padrão de Manutenção): ficha própria, espelhada num Problema de origem "rp".
export const RP_STATUSES = ["analysis", "monitoring", "corrected", "producing"] as const;
export type RpStatus = (typeof RP_STATUSES)[number];

export const RP_STATUS_LABELS: Record<RpStatus, string> = {
  analysis: "Em análise",
  monitoring: "Em monitoramento",
  corrected: "Corrigido",
  producing: "Produzindo",
};

export function isRpStatus(value: string): value is RpStatus {
  return (RP_STATUSES as readonly string[]).includes(value);
}

export const RP_FOUR_M = ["material", "machine", "method", "labor"] as const;
export type RpFourM = (typeof RP_FOUR_M)[number];

export const RP_FOUR_M_LABELS: Record<RpFourM, string> = {
  material: "Material",
  machine: "Máquina",
  method: "Método",
  labor: "Mão de obra",
};

// Um dos 4M: marcado quando o relatório aponta a causa, com o texto que veio junto.
export type RpCauseDto = { marked: boolean; text: string | null };

// Campos que o gestor revisa e grava. A mesma forma serve de entrada (POST/PUT) e de saída.
export type RpFields = {
  occurredAt: string;
  orderNumber: string | null;
  factoryId: string;
  lineId: string | null;
  line: string | null;
  tag: string | null;
  problem: string;
  description: string | null;
  repeatedFailure: boolean;
  repeatedTimes: string | null;
  repeatedPeriod: string | null;
  causes: Record<RpFourM, RpCauseDto>;
  rootCause: string | null;
  corrective: string | null;
  preventive: string | null;
  status: RpStatus;
  basicConditionImpact: string | null;
  memberIds: string[];
  unmatchedTechnicians: string | null;
};

export type RpDto = RpFields & {
  id: string;
  problemRecordId: string | null;
  // Chamado de onde o RP foi escrito.
  chamadoId: string | null;
  rawText: string;
  createdAt: string;
  updatedAt: string;
};

export type RpListItemDto = {
  id: string;
  occurredAt: string;
  line: string | null;
  tag: string | null;
  lineId: string | null;
  problem: string;
  status: RpStatus;
  repeatedFailure: boolean;
  memberIds: string[];
  unmatchedTechnicians: string | null;
};

export type RpPageDto = { items: RpListItemDto[]; nextCursor: string | null };

// Resposta de /rp/parse: o que o texto colado trouxe, já com técnicos e linha casados com o cadastro.
export type RpDraftDto = {
  occurredAt: string | null;
  orderNumber: string | null;
  factoryId: string | null;
  lineId: string | null;
  line: string | null;
  tag: string | null;
  problem: string;
  description: string | null;
  repeatedFailure: boolean;
  repeatedTimes: string | null;
  repeatedPeriod: string | null;
  causes: Record<RpFourM, RpCauseDto>;
  rootCause: string | null;
  corrective: string | null;
  preventive: string | null;
  status: RpStatus;
  basicConditionImpact: string | null;
  memberIds: string[];
  unmatchedTechnicians: string | null;
  rawText: string;
  warnings: string[];
};

export type RpDuplicateDto = {
  id: string;
  occurredAt: string;
  line: string | null;
  tag: string | null;
  problem: string;
  reason: "order" | "same_problem";
};

export type RpMemberSummaryDto = { count: number; items: RpListItemDto[] };

// Itens do PDI formal: ação para fechar uma lacuna da matriz, com prazo, responsável e status.
export const PDI_ITEM_STATUSES = ["planned", "in_progress", "done", "cancelled"] as const;
export type PdiItemStatus = (typeof PDI_ITEM_STATUSES)[number];

export const PDI_ITEM_STATUS_LABELS: Record<PdiItemStatus, string> = {
  planned: "Planejado",
  in_progress: "Em andamento",
  done: "Concluído",
  cancelled: "Cancelado",
};

export function isPdiItemStatus(value: string): value is PdiItemStatus {
  return (PDI_ITEM_STATUSES as readonly string[]).includes(value);
}

export type PdiItemDto = {
  id: string;
  memberId: string;
  title: string;
  skillId: string | null;
  // Competência da avaliação de desempenho que o item quer melhorar.
  competencyId: string | null;
  lineId: string | null;
  responsibleId: string | null;
  // Dia no formato AAAA-MM-DD.
  dueDate: string | null;
  status: PdiItemStatus;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
};

// Pós-preventiva: ocorrência depois de uma preventiva. Datas como AAAA-MM-DD.
export type PostPreventiveFields = {
  preventiveDate: string;
  occurrenceDate: string | null;
  machineId: string;
  subassemblyId: string;
  memberIds: string[];
  done: string;
  occurrence: string;
  preventiveAction: string;
  attentionPoint: string;
  attentionActive: boolean;
  rpId: string | null;
};

// lineId vem da máquina, para filtrar e mostrar a linha sem outra consulta.
export type PostPreventiveDto = PostPreventiveFields & {
  id: string;
  lineId: string;
  createdAt: string;
  updatedAt: string;
};

// Chamados do turno. O chamado continua sendo um registro de origem "chamado", mas fica fora de Pendências:
// o que precisar de ação depois vira uma Tarefa ligada a ele.
export const CHAMADO_SHIFTS = ["first", "second", "third"] as const;
export type ChamadoShift = (typeof CHAMADO_SHIFTS)[number];

export function isChamadoShift(value: string): value is ChamadoShift {
  return (CHAMADO_SHIFTS as readonly string[]).includes(value);
}

// Mesmo status do registro, com os nomes do SIGEM.
export const CHAMADO_STATUS_LABELS: Record<RecordStatus, string> = {
  done: "Liberado",
  open: "Pendente",
  in_progress: "Em andamento",
};

export type ChamadoTaskDto = {
  id: string;
  body: string;
  status: RecordStatus;
  dueAt: string | null;
  memberId: string | null;
};

export type ChamadoDto = {
  id: string;
  dayNumber: number | null;
  // Dia do chamado (AAAA-MM-DD, fuso do gestor), pela abertura.
  day: string;
  shift: ChamadoShift | null;
  occurredAt: string;
  openedAt: string | null;
  closedAt: string | null;
  durationMin: number | null;
  body: string;
  notes: string | null;
  status: RecordStatus;
  lineId: string | null;
  lineLabel: string | null;
  machineId: string | null;
  memberIds: string[];
  tasks: ChamadoTaskDto[];
  rp: { id: string; status: RpStatus } | null;
};

export type ChamadoBody = {
  body: string;
  openedAt: string;
  closedAt: string | null;
  shift: ChamadoShift | null;
  memberIds: string[];
  lineId: string | null;
  lineLabel: string | null;
  machineId: string | null;
  status: RecordStatus;
  notes: string | null;
};

export type ChamadoTaskBody = {
  body: string;
  dueAt: string;
  memberId: string | null;
  priority: RecordPriority | null;
};
