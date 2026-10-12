import { TECH_CARD_DETAIL_FIELDS, TECH_CARD_TYPE_LABELS, type TechCardFields, type TechCardHit, type TechCardType } from "@manutencao/shared";

// Para quem a ficha vale, como o formulário pergunta ("Vale para").
export const SCOPE_KINDS = ["equipment", "machine", "line"] as const;
export type ScopeKind = (typeof SCOPE_KINDS)[number];

export const SCOPE_KIND_LABELS: Record<ScopeKind, string> = {
  equipment: "Modelo (todas as máquinas iguais)",
  machine: "Só esta máquina",
  line: "Linha (ex.: ligação entre máquinas)",
};

export type TechCardFormValues = {
  type: TechCardType;
  scopeKind: ScopeKind;
  // Alvo escolhido para o scopeKind: id do modelo, da máquina ou da linha.
  targetId: string;
  // Linha da máquina, só para a lista de máquinas do formulário.
  lineId: string;
  subassemblyId: string;
  code: string;
  title: string;
  summary: string;
  details: Record<string, string>;
  deviceTag: string;
  originalTerm: string;
  // Etiquetas separadas por vírgula, como o usuário digita.
  tags: string;
  documentId: string;
  page: string;
  sheet: string;
  reviewNeeded: boolean;
};

export type ScopeStart = Partial<Pick<TechCardFormValues, "scopeKind" | "targetId" | "lineId" | "type">>;

/**
 * Ficha em branco; da tela da máquina já vem com a máquina escolhida.
 * @example emptyCardValues({ scopeKind: "machine", targetId: machine.id, lineId: machine.lineId })
 */
export function emptyCardValues(start: ScopeStart = {}): TechCardFormValues {
  return {
    type: start.type ?? "error_code",
    scopeKind: start.scopeKind ?? "equipment",
    targetId: start.targetId ?? "",
    lineId: start.lineId ?? "",
    subassemblyId: "",
    code: "",
    title: "",
    summary: "",
    details: {},
    deviceTag: "",
    originalTerm: "",
    tags: "",
    documentId: "",
    page: "",
    sheet: "",
    reviewNeeded: false,
  };
}

/**
 * Valores do formulário a partir de uma ficha gravada. A linha da máquina vem do cadastro (machineLineId).
 * @example valuesFromCard(card, machines.find((m) => m.id === card.machineId)?.lineId ?? "")
 */
export function valuesFromCard(card: TechCardFields, machineLineId: string): TechCardFormValues {
  const scopeKind: ScopeKind = card.machineId ? "machine" : card.lineId ? "line" : "equipment";
  return {
    type: card.type,
    scopeKind,
    targetId: card.machineId ?? card.lineId ?? card.equipmentId ?? "",
    lineId: card.machineId ? machineLineId : "",
    subassemblyId: card.subassemblyId ?? "",
    code: card.code ?? "",
    title: card.title,
    summary: card.summary,
    details: { ...card.details },
    deviceTag: card.deviceTag ?? "",
    originalTerm: card.originalTerm ?? "",
    tags: card.tags.join(", "),
    documentId: card.documentId ?? "",
    page: card.page?.toString() ?? "",
    sheet: card.sheet ?? "",
    reviewNeeded: card.reviewNeeded,
  };
}

const orNull = (value: string): string | null => value.trim() || null;

/**
 * Corpo para a API: só o alvo do scopeKind vai preenchido; etiquetas viram lista; página vira número.
 * @example bodyFromValues(values).machineId
 */
export function bodyFromValues(values: TechCardFormValues): TechCardFields {
  const page = Number(values.page);
  return {
    type: values.type,
    equipmentId: values.scopeKind === "equipment" ? orNull(values.targetId) : null,
    machineId: values.scopeKind === "machine" ? orNull(values.targetId) : null,
    lineId: values.scopeKind === "line" ? orNull(values.targetId) : null,
    subassemblyId: orNull(values.subassemblyId),
    code: orNull(values.code),
    title: values.title.trim(),
    summary: values.summary.trim(),
    details: Object.fromEntries(
      TECH_CARD_DETAIL_FIELDS[values.type].map((field) => [field.key, values.details[field.key]?.trim() ?? ""]).filter(([, text]) => text),
    ),
    deviceTag: orNull(values.deviceTag),
    originalTerm: orNull(values.originalTerm),
    tags: [...new Set(values.tags.split(",").map((tag) => tag.trim()).filter(Boolean))],
    documentId: orNull(values.documentId),
    page: values.page.trim() && Number.isInteger(page) && page > 0 ? page : null,
    sheet: orNull(values.sheet),
    reviewNeeded: values.reviewNeeded,
  };
}

export function typeLabel(type: TechCardType): string {
  return TECH_CARD_TYPE_LABELS[type].one;
}

/**
 * Como a fonte aparece na ficha: documento, página e folha, só o que existe.
 * @example sourceLabel(card) // "Esquema elétrico CP600 · p. 166 · folha 166"
 */
export function sourceLabel(card: Pick<TechCardHit, "documentName" | "page" | "sheet">): string | null {
  const parts = [card.documentName, card.page ? `p. ${card.page}` : null, card.sheet ? `folha ${card.sheet}` : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/**
 * Tamanho do arquivo legível.
 * @example formatBytes(50_331_648) // "48 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}
