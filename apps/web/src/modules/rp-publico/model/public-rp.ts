import {
  RP_FOUR_M,
  canonicalBasicConditionImpact,
  type PublicRpBody,
  type PublicRpDirectoryDto,
  type PublicRpDto,
  type PublicRpListItemDto,
  type RpDraftDto,
} from "@manutencao/shared";
import { emptyRpValues, todayLocal, valuesFromRp, type RpFormValues } from "../../rp/model/rp";
import { withMachineFromTag } from "../../rp/model/rp-machine-tag";

/**
 * Caminho de uma tela da página pública dentro do link.
 * @example publicRpPath("k8F3…", "novo") // "/rp/abrir/k8F3…/novo"
 */
export function publicRpPath(code: string, ...rest: string[]): string {
  return ["/rp/abrir", code, ...rest].join("/");
}

/**
 * Endereço completo para mandar no WhatsApp.
 * @example publicRpUrl("https://gestao-manutencao.vercel.app", "k8F3…") // "https://…/rp/abrir/k8F3…"
 */
export function publicRpUrl(origin: string, code: string, ...rest: string[]): string {
  return `${origin.replace(/\/+$/, "")}${publicRpPath(code, ...rest)}`;
}

const MEMBER_KEY = "rp-publico-tecnico";

/**
 * Técnico escolhido no "Quem sou", guardado no aparelho. Sem acesso ao armazenamento (aba anônima), volta vazio.
 * @example rememberedMember(window.localStorage) // "m1"
 */
export function rememberedMember(storage: Pick<Storage, "getItem"> | null): string {
  try {
    return storage?.getItem(MEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Guarda (ou apaga, com "") o técnico do aparelho. Falha calada: é só comodidade.
 * @example rememberMember(window.localStorage, "m1")
 */
export function rememberMember(storage: Pick<Storage, "setItem" | "removeItem"> | null, memberId: string): void {
  try {
    if (memberId) storage?.setItem(MEMBER_KEY, memberId);
    else storage?.removeItem(MEMBER_KEY);
  } catch {
    // Sem armazenamento a lista só não abre filtrada da próxima vez.
  }
}

/**
 * Formulário vazio do RP público: data de hoje, e o técnico do aparelho já marcado.
 * @example newPublicValues("m1").memberIds // ["m1"]
 */
export function newPublicValues(memberId: string): RpFormValues {
  return { ...emptyRpValues(), occurredAt: todayLocal(), memberIds: memberId ? [memberId] : [] };
}

/**
 * Valores do formulário a partir do RP colado do WhatsApp: a TAG acha a máquina do cadastro e, se o texto
 * não trouxe técnico liberado, entra o técnico do aparelho.
 * @example valuesFromPastedRp(drafts[0], directory, rememberedMemberId).problem
 */
export function valuesFromPastedRp(draft: RpDraftDto, directory: PublicRpDirectoryDto, deviceMemberId: string): RpFormValues {
  const values = withMachineFromTag(valuesFromRp(draft), directory.machines, directory.lines);
  const memberIds = values.memberIds.length || !deviceMemberId ? values.memberIds : [deviceMemberId];
  // O texto colado não vai para a página pública: só os campos (ver parsePublicRp na API).
  return { ...values, memberIds, unmatchedTechnicians: "" };
}

/**
 * Valores do formulário a partir do RP público gravado.
 * @example valuesFromPublicRp(rp).problem
 */
export function valuesFromPublicRp(rp: PublicRpDto): RpFormValues {
  const causes = Object.fromEntries(RP_FOUR_M.map((key) => [key, { marked: rp.causes[key].marked, text: rp.causes[key].text ?? "" }]));
  return {
    occurredAt: rp.occurredAt.slice(0, 10),
    orderNumber: rp.orderNumber ?? "",
    factoryId: rp.factoryId,
    lineId: rp.lineId ?? "",
    line: rp.line ?? "",
    tag: rp.tag ?? "",
    machineId: rp.machineId ?? "",
    subassemblyId: "",
    problem: rp.problem,
    description: rp.description ?? "",
    repeatedFailure: rp.repeatedFailure,
    repeatedTimes: rp.repeatedTimes ?? "",
    repeatedPeriod: rp.repeatedPeriod ?? "",
    causes: causes as RpFormValues["causes"],
    rootCause: rp.rootCause ?? "",
    corrective: rp.corrective ?? "",
    preventive: rp.preventive ?? "",
    status: rp.status,
    basicConditionImpact: canonicalBasicConditionImpact(rp.basicConditionImpact) ?? "",
    memberIds: rp.memberIds,
    unmatchedTechnicians: "",
  };
}

function blank(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

/**
 * Corpo do POST/PATCH público. `website` é o campo-isca: vai como veio (vazio, se foi gente).
 * @example publicBodyFromValues(values, { revised: true, website: "" }).revised // true
 */
export function publicBodyFromValues(values: RpFormValues, extra: { revised: boolean; website: string }): PublicRpBody {
  return {
    occurredAt: values.occurredAt,
    orderNumber: blank(values.orderNumber),
    factoryId: values.factoryId,
    lineId: blank(values.lineId),
    line: blank(values.line),
    tag: blank(values.tag),
    machineId: blank(values.machineId),
    problem: values.problem,
    description: blank(values.description),
    repeatedFailure: values.repeatedFailure,
    repeatedTimes: values.repeatedFailure ? blank(values.repeatedTimes) : null,
    repeatedPeriod: values.repeatedFailure ? blank(values.repeatedPeriod) : null,
    causes: Object.fromEntries(
      RP_FOUR_M.map((key) => [key, { marked: values.causes[key].marked, text: blank(values.causes[key].text) }]),
    ) as PublicRpBody["causes"],
    rootCause: blank(values.rootCause),
    corrective: blank(values.corrective),
    preventive: blank(values.preventive),
    status: values.status,
    basicConditionImpact: blank(values.basicConditionImpact),
    memberIds: values.memberIds,
    revised: extra.revised,
    website: extra.website,
  };
}

/**
 * Escolher a linha do cadastro: a fábrica vem junto, o nome vai para o campo de texto e a máquina zera.
 * Linha "" é "outra linha", escrita à mão.
 * @example withLine(values, "l1", directory.lines).line // "Cam 08"
 */
export function withLine(values: RpFormValues, lineId: string, lines: PublicRpDirectoryDto["lines"]): RpFormValues {
  const line = lines.find((item) => item.id === lineId);
  if (!line) return { ...values, lineId: "", machineId: "" };
  return { ...values, lineId, line: line.name, factoryId: line.factoryId, machineId: "" };
}

/**
 * Escolher a máquina preenche a TAG com a do cadastro (quando ela tem).
 * @example withMachine(values, "mq1", directory.machines).tag // "EBS-BLI-31"
 */
export function withMachine(values: RpFormValues, machineId: string, machines: PublicRpDirectoryDto["machines"]): RpFormValues {
  const machine = machines.find((item) => item.id === machineId);
  return { ...values, machineId, tag: machine?.tag ?? values.tag };
}

/**
 * Linha e TAG do item da lista, sem repetir o mesmo texto.
 * @example placeOf(item, new Map([["l1", "Cam 08"]])) // ["Cam 08", "EBS-BLI-31"]
 */
export function placeOf(item: Pick<PublicRpListItemDto, "lineId" | "line" | "tag">, lineNames: ReadonlyMap<string, string>): string[] {
  const first = (item.lineId && lineNames.get(item.lineId)) || item.line;
  const parts = [first, item.tag].filter((part): part is string => Boolean(part));
  return parts.filter((part, index) => parts.findIndex((other) => other.replace(/\s+/g, "").toLowerCase() === part.replace(/\s+/g, "").toLowerCase()) === index);
}

/**
 * Técnicos que o formulário oferece: os liberados, mais os que o RP já tem (mesmo que tenham saído da lista).
 * @example memberChoices(directory.members, rp) // [{ value: "m1", label: "Rogério B" }, …]
 */
export function memberChoices(
  allowed: PublicRpDirectoryDto["members"],
  current: Pick<PublicRpDto, "memberIds" | "memberNames"> | null,
): { value: string; label: string }[] {
  const options = allowed.map((member) => ({ value: member.id, label: member.name }));
  if (!current) return options;
  // A API pula nome que não acha; aí a ordem dos nomes não bate com a dos ids.
  const aligned = current.memberNames.length === current.memberIds.length;
  const extra = current.memberIds
    .map((id, index) => ({ value: id, label: aligned ? current.memberNames[index]! : "Técnico" }))
    .filter((option) => !options.some((item) => item.value === option.value));
  return [...options, ...extra];
}
