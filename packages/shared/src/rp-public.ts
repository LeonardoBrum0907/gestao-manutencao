import type { RpCauseDto, RpFourM, RpStatus } from "./index";

// Página pública de RPs (sem login): o link vai para técnicos e supervisores, que criam, leem e editam
// os RPs feitos nela. O app do coordenador vê todos, com a origem marcada.

export const RP_SOURCES = ["paste", "public"] as const;
export type RpSource = (typeof RP_SOURCES)[number];

export const RP_SOURCE_LABELS: Record<RpSource, string> = {
  paste: "App",
  public: "Página pública",
};

/**
 * Confere a origem vinda de fora (filtro da lista, linha do banco).
 * @example isRpSource("public") // true
 */
export function isRpSource(value: string): value is RpSource {
  return (RP_SOURCES as readonly string[]).includes(value);
}

// edit: editado pelo link; review_request: supervisor pediu revisão; restore: coordenador desfez no app;
// approve e reject: supervisor aprovou ou recusou pela página pública.
export const RP_REVISION_KINDS = ["edit", "review_request", "restore", "approve", "reject"] as const;
export type RpRevisionKind = (typeof RP_REVISION_KINDS)[number];

export const RP_REVISION_LABELS: Record<RpRevisionKind, string> = {
  edit: "Editado pela página pública",
  review_request: "Revisão pedida",
  restore: "Desfeito no app",
  approve: "Aprovado pela página pública",
  reject: "Recusado pela página pública",
};

/**
 * Confere o tipo de uma linha do histórico gravada no banco.
 * @example isRpRevisionKind("edit") // true
 */
export function isRpRevisionKind(value: string): value is RpRevisionKind {
  return (RP_REVISION_KINDS as readonly string[]).includes(value);
}

// Situação do RP na avaliação do supervisor. Aprovado também vale quando o coordenador confere no app.
// Só uma de cada vez: aprovar, recusar ou pedir revisão apaga as outras.
export const RP_PUBLIC_DECISIONS = ["pending", "approved", "rejected", "revision"] as const;
export type RpPublicDecision = (typeof RP_PUBLIC_DECISIONS)[number];

export const RP_PUBLIC_DECISION_LABELS: Record<RpPublicDecision, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Recusado",
  revision: "Revisar",
};

/**
 * Confere a situação vinda de fora (filtro da lista).
 * @example isRpPublicDecision("approved") // true
 */
export function isRpPublicDecision(value: string): value is RpPublicDecision {
  return (RP_PUBLIC_DECISIONS as readonly string[]).includes(value);
}

/**
 * Situação a partir das marcas do RP. Pedido de revisão vem antes: é o que ainda espera alguém.
 * @example rpPublicDecisionOf({ approved: true, rejected: false, reviewRequested: false }) // "approved"
 */
export function rpPublicDecisionOf(marks: { approved: boolean; rejected: boolean; reviewRequested: boolean }): RpPublicDecision {
  if (marks.reviewRequested) return "revision";
  if (marks.rejected) return "rejected";
  if (marks.approved) return "approved";
  return "pending";
}

// O que o supervisor faz com vários RPs marcados de uma vez.
export const RP_BULK_ACTIONS = ["approve", "reject", "request_review"] as const;
export type RpBulkAction = (typeof RP_BULK_ACTIONS)[number];

/**
 * Confere a ação vinda de fora.
 * @example isRpBulkAction("approve") // true
 */
export function isRpBulkAction(value: string): value is RpBulkAction {
  return (RP_BULK_ACTIONS as readonly string[]).includes(value);
}

// note: o que revisar (obrigatório no pedido de revisão) ou o motivo da recusa (opcional).
export type RpBulkReviewBody = { ids: string[]; action: RpBulkAction; note?: string };
export type RpBulkReviewResultDto = { updated: number };

// Campos que a página pública escreve. Sem subconjunto, chamado, texto colado nem nomes fora do cadastro:
// isso é do coordenador.
export type PublicRpFields = {
  occurredAt: string;
  orderNumber: string | null;
  factoryId: string;
  lineId: string | null;
  line: string | null;
  tag: string | null;
  machineId: string | null;
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
};

// Corpo do POST/PATCH público. revised: o técnico marcou que corrigiu o pedido de revisão.
// website: campo-isca escondido; gente nunca preenche, robô preenche.
export type PublicRpBody = PublicRpFields & { revised?: boolean; website?: string };

export type PublicRpDto = PublicRpFields & {
  id: string;
  // Nomes dos técnicos do RP, mesmo de quem saiu da lista do formulário depois.
  memberNames: string[];
  // Aprovado pelo supervisor ou conferido pelo coordenador no app: é o que vai para a planilha.
  approved: boolean;
  decision: RpPublicDecision;
  rejectionNote: string | null;
  reviewRequest: string | null;
  reviewRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicRpListItemDto = {
  id: string;
  occurredAt: string;
  lineId: string | null;
  line: string | null;
  tag: string | null;
  problem: string;
  status: RpStatus;
  repeatedFailure: boolean;
  memberIds: string[];
  memberNames: string[];
  reviewRequested: boolean;
  // Aprovado (ver PublicRpDto.approved).
  approved: boolean;
  decision: RpPublicDecision;
};

export type PublicRpPageDto = { items: PublicRpListItemDto[]; nextCursor: string | null };

// O que o formulário público precisa do cadastro. Técnicos: só os liberados na ficha do colaborador.
export type PublicRpDirectoryDto = {
  factories: { id: string; name: string }[];
  lines: { id: string; name: string; internalCode: string | null; factoryId: string }[];
  machines: { id: string; name: string; tag: string | null; lineId: string }[];
  members: { id: string; name: string }[];
};

export type RpPublicLinkDto = { code: string; createdAt: string };

// null: a página pública está desligada.
export type RpPublicLinkStateDto = { link: RpPublicLinkDto | null };

/** Link pessoal de um supervisor: o mesmo endereço da página pública, com o código dele. */
export type RpSupervisorLinkDto = { id: string; name: string; code: string; createdAt: string };

export type RpSupervisorLinkBody = { name: string };

/**
 * Quem está abrindo a página pública. O link da equipe (técnicos) só lê, cria e edita;
 * o link de um supervisor também aprova, recusa, pede revisão e exporta.
 */
export type PublicRpAccessDto = { role: "team" } | { role: "supervisor"; supervisorName: string };

export type RpRevisionDto = {
  id: string;
  rpId: string;
  kind: RpRevisionKind;
  note: string | null;
  // Os campos do RP antes da mudança: "Desfazer" volta para eles.
  before: PublicRpFields;
  // Supervisor que aprovou, recusou ou pediu revisão pelo link dele; null nas edições.
  actorName: string | null;
  createdAt: string;
};
