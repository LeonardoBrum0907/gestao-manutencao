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

// edit: editado pelo link; review_request: supervisor pediu revisão; restore: coordenador desfez no app.
export const RP_REVISION_KINDS = ["edit", "review_request", "restore"] as const;
export type RpRevisionKind = (typeof RP_REVISION_KINDS)[number];

export const RP_REVISION_LABELS: Record<RpRevisionKind, string> = {
  edit: "Editado pela página pública",
  review_request: "Revisão pedida",
  restore: "Desfeito no app",
};

/**
 * Confere o tipo de uma linha do histórico gravada no banco.
 * @example isRpRevisionKind("edit") // true
 */
export function isRpRevisionKind(value: string): value is RpRevisionKind {
  return (RP_REVISION_KINDS as readonly string[]).includes(value);
}

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
  // Conferido pelo coordenador no app: é o RP "aprovado" que o supervisor pode exportar.
  approved: boolean;
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
  // Conferido pelo coordenador no app (ver PublicRpDto.approved).
  approved: boolean;
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

export type RpRevisionDto = {
  id: string;
  rpId: string;
  kind: RpRevisionKind;
  note: string | null;
  // Os campos do RP antes da mudança: "Desfazer" volta para eles.
  before: PublicRpFields;
  createdAt: string;
};
