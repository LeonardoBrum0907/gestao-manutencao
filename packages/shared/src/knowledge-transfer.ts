// Repasse: um técnico ensina outro a fazer o que ele faz. Não tem grau-alvo nem promoção (pedido do Léo em
// 2026-10-12): a cultura é cada um preparar alguém, e o sistema só acompanha o quanto já foi repassado.

/** Nota a partir da qual alguém domina uma habilidade: 3 (Avançado) ou 4 (Referência). */
export const TRANSFER_MASTERY_SCORE = 3;

/** Dias sem nota nova de quem aprende, nos equipamentos do repasse, para ele contar como parado. */
export const TRANSFER_STALE_DAYS = 60;

export const TRANSFER_STATUSES = ["active", "closed"] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export type TransferPersonDto = { id: string; name: string; teamName: string | null };

// Das habilidades que quem ensina domina: quantas quem aprende já faz (nota 3+), quantas estão perto (nota 2)
// e quantas começam do zero (nota 0 ou 1, ou sem nota). percent é nulo quando quem ensina não domina nada no foco.
export type TransferProgressDto = { mastered: number; done: number; near: number; fromZero: number; percent: number | null };

export type TransferSummaryDto = {
  id: string;
  teacher: TransferPersonDto;
  learner: TransferPersonDto;
  // Equipamentos da matriz em foco (os de quem ensina, por padrão).
  equipmentIds: string[];
  status: TransferStatus;
  startedAt: string;
  closedAt: string | null;
  // Última nota nova de quem aprende no foco desde o início (ou o próprio início).
  lastProgressAt: string;
  stale: boolean;
  progress: TransferProgressDto;
};

export type TransferListDto = {
  transfers: TransferSummaryDto[];
  // Técnicos ativos e quantos deles ensinam alguém num repasse em andamento: o número da cultura.
  technicians: number;
  teaching: number;
};

export type TransferEquipmentDto = { equipmentId: string; name: string; mastered: number; done: number };

// Habilidade que quem ensina domina e quem aprende ainda não faz.
export type TransferGapDto = {
  skillId: string;
  equipmentName: string;
  subgroup: string;
  text: string;
  learnerScore: number | null;
  teacherScore: number;
  // Item de PDI em aberto de quem aprende para esta habilidade.
  openPdiItemId: string | null;
};

// Ponto da curva de evolução: dia (AAAA-MM-DD) e o repassado naquele dia.
export type TransferPointDto = { date: string; percent: number };

export type TransferDetailDto = TransferSummaryDto & {
  byEquipment: TransferEquipmentDto[];
  gaps: TransferGapDto[];
  evolution: TransferPointDto[];
};

export type TransferCandidateDto = {
  member: TransferPersonDto;
  progress: TransferProgressDto;
  // Nome de quem já ensina esta pessoa num repasse em andamento.
  learningFrom: string | null;
};

export type TransferSuggestionDto = {
  teacherId: string;
  // Equipamentos considerados (os pedidos ou, sem pedido, todos os de quem ensina).
  equipmentIds: string[];
  mastered: number;
  candidates: TransferCandidateDto[];
};

export type TransferCreateBody = { teacherId: string; learnerId: string; equipmentIds: string[] };
