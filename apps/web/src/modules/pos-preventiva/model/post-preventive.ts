import { subassemblyReaches, type PostPreventiveDto, type PostPreventiveFields, type SubassemblyDto, type SubassemblyHolder } from "@manutencao/shared";

export type PostPreventiveFormValues = {
  preventiveDate: string;
  occurrenceDate: string;
  lineId: string;
  machineId: string;
  subassemblyId: string;
  memberIds: string[];
  done: string;
  occurrence: string;
  preventiveAction: string;
  attentionPoint: string;
  attentionActive: boolean;
  rpId: string;
};

export function emptyValues(today: string, place: { lineId?: string; machineId?: string } = {}): PostPreventiveFormValues {
  return {
    preventiveDate: today,
    occurrenceDate: "",
    lineId: place.lineId ?? "",
    machineId: place.machineId ?? "",
    subassemblyId: "",
    memberIds: [],
    done: "",
    occurrence: "",
    preventiveAction: "",
    attentionPoint: "",
    attentionActive: true,
    rpId: "",
  };
}

export function valuesFromDto(item: PostPreventiveDto): PostPreventiveFormValues {
  return {
    preventiveDate: item.preventiveDate,
    occurrenceDate: item.occurrenceDate ?? "",
    lineId: item.lineId,
    machineId: item.machineId,
    subassemblyId: item.subassemblyId,
    memberIds: item.memberIds,
    done: item.done,
    occurrence: item.occurrence,
    preventiveAction: item.preventiveAction,
    attentionPoint: item.attentionPoint,
    attentionActive: item.attentionActive,
    rpId: item.rpId ?? "",
  };
}

/**
 * Se o formulário tem mudança ainda não gravada (campo a campo; técnicos na mesma ordem). Exportar usa o que está gravado.
 * @example formChanged(gravado, { ...gravado, attentionPoint: "Medir a placa" }) // true
 */
export function formChanged(saved: PostPreventiveFormValues, current: PostPreventiveFormValues): boolean {
  const keys = Object.keys(saved) as (keyof PostPreventiveFormValues)[];
  return keys.some((key) => JSON.stringify(saved[key]) !== JSON.stringify(current[key]));
}

export function bodyFromValues(values: PostPreventiveFormValues): PostPreventiveFields {
  return {
    preventiveDate: values.preventiveDate,
    occurrenceDate: values.occurrenceDate || null,
    machineId: values.machineId,
    subassemblyId: values.subassemblyId,
    memberIds: values.memberIds,
    done: values.done,
    occurrence: values.occurrence,
    preventiveAction: values.preventiveAction,
    attentionPoint: values.attentionPoint,
    attentionActive: values.attentionActive,
    rpId: values.rpId || null,
  };
}

export type SubassemblyGroup = { subassemblyId: string; name: string; items: PostPreventiveDto[] };

// Fichas agrupadas por subconjunto, na ordem do cadastro do modelo; dentro do grupo, a mais recente primeiro.
export function groupBySubassembly(items: PostPreventiveDto[], subassemblies: SubassemblyDto[]): SubassemblyGroup[] {
  const order = new Map(subassemblies.map((item, index) => [item.id, index]));
  const names = new Map(subassemblies.map((item) => [item.id, item.name]));
  const groups = new Map<string, SubassemblyGroup>();
  for (const item of items) {
    const group = groups.get(item.subassemblyId) ?? { subassemblyId: item.subassemblyId, name: names.get(item.subassemblyId) ?? "Subconjunto", items: [] };
    group.items.push(item);
    groups.set(item.subassemblyId, group);
  }
  return [...groups.values()].sort((a, b) => (order.get(a.subassemblyId) ?? Infinity) - (order.get(b.subassemblyId) ?? Infinity));
}

/**
 * Opções do filtro Subconjunto da lista: só os que alcançam a máquina escolhida (do modelo dela ou só dela).
 * Arquivados e desmarcados continuam, porque fichas antigas podem usá-los.
 * @example subassemblyFilterOptions(todos, maquina) // sem os subconjuntos só de outra máquina do modelo
 */
export function subassemblyFilterOptions(subassemblies: SubassemblyDto[], machine: SubassemblyHolder | undefined): SubassemblyDto[] {
  if (!machine) return [];
  return subassemblies.filter((item) => subassemblyReaches(item, machine));
}
