import { isPdiItemStatus, type PdiItemStatus } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export type PdiItemFields = {
  title: string;
  skillId: string | null;
  lineId: string | null;
  responsibleId: string | null;
  dueDate: string | null;
  status: PdiItemStatus;
  notes: string | null;
};

const TITLE_MAX = 200;
const NOTES_MAX = 1000;

function text(value: unknown, max: number, message: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new DomainError("invalid", 400, message);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new DomainError("invalid", 400, message);
  return trimmed.length ? trimmed : null;
}

function reference(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new DomainError("invalid", 400, "Dados inválidos.");
  return value;
}

// Dia do prazo como AAAA-MM-DD; recusa datas que não existem (31/02).
export function parseDueDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new DomainError("invalid", 400, "Prazo inválido.");
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new DomainError("invalid", 400, "Prazo inválido.");
  return value;
}

// Criação: o título é obrigatório e o status começa em "planejado". Alteração: só vai o que veio.
export function readPdiItem(source: Record<string, unknown>, partial: boolean): Partial<PdiItemFields> {
  const fields: Partial<PdiItemFields> = {};
  if (!partial || "title" in source) {
    const title = text(source.title, TITLE_MAX, "Título inválido (até 200 caracteres).");
    if (!title) throw new DomainError("invalid", 400, "Informe a ação do PDI.");
    fields.title = title;
  }
  if ("skillId" in source) fields.skillId = reference(source.skillId);
  if ("lineId" in source) fields.lineId = reference(source.lineId);
  if ("responsibleId" in source) fields.responsibleId = reference(source.responsibleId);
  if ("dueDate" in source) fields.dueDate = parseDueDate(source.dueDate);
  if ("notes" in source) fields.notes = text(source.notes, NOTES_MAX, "Observação inválida (até 1000 caracteres).");
  if ("status" in source) {
    if (typeof source.status !== "string" || !isPdiItemStatus(source.status)) throw new DomainError("invalid", 400, "Status inválido.");
    fields.status = source.status;
  }
  return fields;
}

// A data de conclusão acompanha o status: marca ao concluir, limpa se reabrir.
export function completedAtFor(status: PdiItemStatus, previous: Date | null, now: Date): Date | null {
  if (status !== "done") return null;
  return previous ?? now;
}
