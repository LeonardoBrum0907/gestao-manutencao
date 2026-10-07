import type { PostPreventiveFields } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

const TEXT_MAX = 4000;

function text(source: Record<string, unknown>, key: string, message: string): string {
  const value = source[key];
  if (typeof value !== "string") throw new DomainError("invalid", 400, message);
  const trimmed = value.trim();
  if (!trimmed) throw new DomainError("invalid", 400, message);
  if (trimmed.length > TEXT_MAX) throw new DomainError("invalid", 400, "Texto grande demais (até 4000 caracteres).");
  return trimmed;
}

function reference(source: Record<string, unknown>, key: string, message: string): string {
  const value = source[key];
  if (typeof value !== "string" || !value) throw new DomainError("invalid", 400, message);
  return value;
}

// Dia como AAAA-MM-DD; recusa datas que não existem (31/02).
export function parseDay(value: unknown, message: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new DomainError("invalid", 400, message);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new DomainError("invalid", 400, message);
  return value;
}

function memberIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new DomainError("invalid", 400, "Técnicos inválidos.");
  }
  const ids = [...new Set((value as string[]).filter(Boolean))];
  if (!ids.length) throw new DomainError("members", 400, "Escolha ao menos um técnico.");
  return ids;
}

export function readPostPreventive(source: Record<string, unknown>): PostPreventiveFields {
  const preventiveDate = parseDay(source.preventiveDate, "Data da preventiva inválida.");
  if (!preventiveDate) throw new DomainError("invalid", 400, "Informe a data da preventiva.");
  const occurrenceDate = parseDay(source.occurrenceDate, "Data da ocorrência inválida.");
  if (occurrenceDate && occurrenceDate < preventiveDate) {
    throw new DomainError("invalid", 400, "A ocorrência não pode ser antes da preventiva.");
  }
  const active = source.attentionActive;
  if (active !== undefined && typeof active !== "boolean") throw new DomainError("invalid", 400, "Dados inválidos.");
  const rpId = source.rpId;
  if (rpId !== undefined && rpId !== null && rpId !== "" && typeof rpId !== "string") throw new DomainError("invalid", 400, "RP inválido.");
  return {
    preventiveDate,
    occurrenceDate,
    machineId: reference(source, "machineId", "Escolha a máquina."),
    subassemblyId: reference(source, "subassemblyId", "Escolha o subconjunto."),
    memberIds: memberIds(source.memberIds),
    done: text(source, "done", "Conte o que foi feito na preventiva."),
    occurrence: text(source, "occurrence", "Descreva a ocorrência."),
    preventiveAction: text(source, "preventiveAction", "Informe a ação preventiva."),
    attentionPoint: text(source, "attentionPoint", "Informe o ponto de atenção."),
    attentionActive: active ?? true,
    rpId: typeof rpId === "string" && rpId ? rpId : null,
  };
}

// O subconjunto vem do modelo da máquina. Um subconjunto arquivado só fica se a ficha já apontava para ele.
export function assertSubassemblyFits(
  machine: { equipmentId: string | null },
  subassembly: { id: string; equipmentId: string; archived: boolean },
  currentSubassemblyId: string | null,
): void {
  if (!machine.equipmentId) {
    throw new DomainError("machine_without_model", 400, "Esta máquina não tem modelo de equipamento. Escolha o modelo no cadastro da linha.");
  }
  if (subassembly.equipmentId !== machine.equipmentId) {
    throw new DomainError("subassembly", 400, "Este subconjunto não é do modelo desta máquina.");
  }
  if (subassembly.archived && subassembly.id !== currentSubassemblyId) {
    throw new DomainError("subassembly", 400, "Este subconjunto está arquivado.");
  }
}
