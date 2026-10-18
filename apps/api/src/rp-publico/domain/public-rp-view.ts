import { rpPublicDecisionOf, type PublicRpDto, type PublicRpFields, type PublicRpListItemDto, type RpDto, type RpListItemDto } from "@manutencao/shared";

/**
 * Os campos que a página pública vê e edita, sem o que é do coordenador (subconjunto, chamado, texto colado).
 * Também é o "antes" guardado no histórico.
 * @example publicFieldsOf(rp).problem
 */
export function publicFieldsOf(rp: RpDto): PublicRpFields {
  return {
    occurredAt: rp.occurredAt,
    orderNumber: rp.orderNumber,
    factoryId: rp.factoryId,
    lineId: rp.lineId,
    line: rp.line,
    tag: rp.tag,
    machineId: rp.machineId,
    problem: rp.problem,
    description: rp.description,
    repeatedFailure: rp.repeatedFailure,
    repeatedTimes: rp.repeatedTimes,
    repeatedPeriod: rp.repeatedPeriod,
    causes: rp.causes,
    rootCause: rp.rootCause,
    corrective: rp.corrective,
    preventive: rp.preventive,
    status: rp.status,
    basicConditionImpact: rp.basicConditionImpact,
    memberIds: rp.memberIds,
  };
}

function namesOf(ids: string[], names: ReadonlyMap<string, string>): string[] {
  return ids.map((id) => names.get(id)).filter((name): name is string => Boolean(name));
}

/**
 * Ficha do RP como a página pública mostra, com os nomes dos técnicos.
 * @example toPublicRp(rp, new Map([["m1", "Rogério B"]])).memberNames // ["Rogério B"]
 */
export function toPublicRp(rp: RpDto, names: ReadonlyMap<string, string>): PublicRpDto {
  const decision = rpPublicDecisionOf({ approved: rp.checkedAt !== null, rejected: rp.rejectedAt !== null, reviewRequested: rp.reviewRequestedAt !== null });
  return {
    ...publicFieldsOf(rp),
    id: rp.id,
    memberNames: namesOf(rp.memberIds, names),
    approved: decision === "approved",
    decision,
    rejectionNote: rp.rejectionNote,
    reviewRequest: rp.reviewRequest,
    reviewRequestedAt: rp.reviewRequestedAt,
    createdAt: rp.createdAt,
    updatedAt: rp.updatedAt,
  };
}

/**
 * Item da lista pública, com os nomes dos técnicos.
 * @example toPublicListItem(item, names).reviewRequested
 */
export function toPublicListItem(item: RpListItemDto, names: ReadonlyMap<string, string>): PublicRpListItemDto {
  const decision = rpPublicDecisionOf({ approved: item.checked, rejected: item.rejected, reviewRequested: item.reviewRequested });
  return {
    id: item.id,
    occurredAt: item.occurredAt,
    lineId: item.lineId,
    line: item.line,
    tag: item.tag,
    problem: item.problem,
    status: item.status,
    repeatedFailure: item.repeatedFailure,
    memberIds: item.memberIds,
    memberNames: namesOf(item.memberIds, names),
    reviewRequested: item.reviewRequested,
    // RP antigo pode ter conferido e pedido de revisão juntos: vale a situação, não a marca.
    approved: decision === "approved",
    decision,
  };
}
