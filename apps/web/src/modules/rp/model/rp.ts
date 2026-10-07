import {
  RP_FOUR_M,
  RP_STATUSES,
  RP_STATUS_LABELS,
  type RpCauseDto,
  type RpDraftDto,
  type RpDto,
  type RpFourM,
  type RpStatus,
} from "@manutencao/shared";
import type { RpBody } from "../data/rp";

export const rpStatusOptions = RP_STATUSES.map((status) => ({ value: status, label: RP_STATUS_LABELS[status] }));

export function rpStatusLabel(status: RpStatus): string {
  return RP_STATUS_LABELS[status];
}

export function rpStatusChipClass(status: RpStatus): string {
  if (status === "monitoring") return "rounded-control bg-accent-soft px-2 py-1 text-xs font-semibold text-accent";
  if (status === "corrected" || status === "producing") return "rounded-control bg-chip px-2 py-1 text-xs font-medium text-muted";
  return "rounded-control bg-chip px-2 py-1 text-xs font-semibold text-app";
}

// O dia do relatório é guardado ao meio-dia UTC: mostra em UTC para o dia nunca mudar com o fuso.
const dayFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

export function formatRpDay(iso: string): string {
  return dayFormat.format(new Date(iso));
}

export function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

export function todayLocal(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export type RpFormValues = {
  occurredAt: string;
  orderNumber: string;
  factoryId: string;
  lineId: string;
  line: string;
  tag: string;
  problem: string;
  description: string;
  repeatedFailure: boolean;
  repeatedTimes: string;
  repeatedPeriod: string;
  causes: Record<RpFourM, { marked: boolean; text: string }>;
  rootCause: string;
  corrective: string;
  preventive: string;
  status: RpStatus;
  basicConditionImpact: string;
  memberIds: string[];
  unmatchedTechnicians: string;
};

function causeValues(causes: Record<RpFourM, RpCauseDto>): RpFormValues["causes"] {
  return Object.fromEntries(RP_FOUR_M.map((key) => [key, { marked: causes[key].marked, text: causes[key].text ?? "" }])) as RpFormValues["causes"];
}

export function emptyRpValues(): RpFormValues {
  return {
    occurredAt: todayLocal(),
    orderNumber: "",
    factoryId: "",
    lineId: "",
    line: "",
    tag: "",
    problem: "",
    description: "",
    repeatedFailure: false,
    repeatedTimes: "",
    repeatedPeriod: "",
    causes: causeValues({
      material: { marked: false, text: null },
      machine: { marked: false, text: null },
      method: { marked: false, text: null },
      labor: { marked: false, text: null },
    }),
    rootCause: "",
    corrective: "",
    preventive: "",
    status: "analysis",
    basicConditionImpact: "",
    memberIds: [],
    unmatchedTechnicians: "",
  };
}

export function valuesFromRp(rp: RpDto | RpDraftDto): RpFormValues {
  return {
    occurredAt: rp.occurredAt ? dayOf(rp.occurredAt) : todayLocal(),
    orderNumber: rp.orderNumber ?? "",
    factoryId: rp.factoryId ?? "",
    lineId: rp.lineId ?? "",
    line: rp.line ?? "",
    tag: rp.tag ?? "",
    problem: rp.problem,
    description: rp.description ?? "",
    repeatedFailure: rp.repeatedFailure,
    repeatedTimes: rp.repeatedTimes ?? "",
    repeatedPeriod: rp.repeatedPeriod ?? "",
    causes: causeValues(rp.causes),
    rootCause: rp.rootCause ?? "",
    corrective: rp.corrective ?? "",
    preventive: rp.preventive ?? "",
    status: rp.status,
    basicConditionImpact: rp.basicConditionImpact ?? "",
    memberIds: rp.memberIds,
    unmatchedTechnicians: rp.unmatchedTechnicians ?? "",
  };
}

function blank(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

export function bodyFromValues(values: RpFormValues, rawText: string): RpBody {
  return {
    occurredAt: values.occurredAt,
    orderNumber: blank(values.orderNumber),
    factoryId: values.factoryId,
    lineId: blank(values.lineId),
    line: blank(values.line),
    tag: blank(values.tag),
    problem: values.problem,
    description: blank(values.description),
    repeatedFailure: values.repeatedFailure,
    repeatedTimes: blank(values.repeatedTimes),
    repeatedPeriod: blank(values.repeatedPeriod),
    causes: Object.fromEntries(
      RP_FOUR_M.map((key) => [key, { marked: values.causes[key].marked, text: blank(values.causes[key].text) }]),
    ) as RpBody["causes"],
    rootCause: blank(values.rootCause),
    corrective: blank(values.corrective),
    preventive: blank(values.preventive),
    status: values.status,
    basicConditionImpact: blank(values.basicConditionImpact),
    memberIds: values.memberIds,
    unmatchedTechnicians: blank(values.unmatchedTechnicians),
    rawText,
  };
}
