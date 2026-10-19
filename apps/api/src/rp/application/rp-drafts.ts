import type { RpDraftDto } from "@manutencao/shared";
import { matchLine, matchMembers, type LineRef, type MemberRef } from "../domain/rp-match";
import { parseRpText, type ParsedRp } from "../domain/rp-text";

/**
 * Lê o texto colado do WhatsApp e já sugere linha, fábrica e técnicos a partir das listas dadas. Não grava nada.
 * O app passa o cadastro inteiro; a página pública, só os técnicos liberados nela.
 * @example rpDrafts(textoDoWhatsapp, members, lines)[0].lineId // "l1"
 */
export function rpDrafts(text: string, members: MemberRef[], lines: LineRef[]): RpDraftDto[] {
  return parseRpText(text).map((report) => {
    const line = matchLine(report.line, report.tag, lines);
    const match = matchMembers(report.technicians, members);
    const warnings = [...report.warnings];
    if (match.unmatched.length) warnings.push(`Técnico não encontrado no cadastro: ${match.unmatched.join(", ")}.`);
    if (!line) warnings.push("Linha não encontrada no cadastro: ficou só com a linha e a TAG do texto. Escolha a fábrica antes de salvar.");
    return draft(report, line?.id ?? null, line?.factoryId ?? null, match.memberIds, match.unmatched, warnings);
  });
}

function draft(
  report: ParsedRp,
  lineId: string | null,
  factoryId: string | null,
  memberIds: string[],
  unmatched: string[],
  warnings: string[],
): RpDraftDto {
  return {
    occurredAt: report.date,
    orderNumber: report.orderNumber,
    factoryId,
    lineId,
    line: report.line,
    tag: report.tag,
    machineId: null,
    subassemblyId: null,
    problem: report.problem,
    description: report.description,
    repeatedFailure: report.repeatedFailure,
    repeatedTimes: report.repeatedTimes,
    repeatedPeriod: report.repeatedPeriod,
    causes: report.causes,
    rootCause: report.rootCause,
    corrective: report.corrective,
    preventive: report.preventive,
    status: report.status,
    basicConditionImpact: report.basicConditionImpact,
    memberIds,
    unmatchedTechnicians: unmatched.length ? unmatched.join(", ") : null,
    rawText: report.rawText,
    warnings,
  };
}
