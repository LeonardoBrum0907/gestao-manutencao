import { GESTOR_TIME_ZONE, type PdiItemDto, type PdiItemStatus } from "@manutencao/shared";

export type PdiItemWrite = {
  title: string;
  skillId: string | null;
  lineId: string | null;
  responsibleId: string | null;
  dueDate: string | null;
  status: PdiItemStatus;
  notes: string | null;
};

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

// Hoje no fuso do gestor, como AAAA-MM-DD (compara direto com o prazo).
export function todayIso(now = new Date()): string {
  return dayFormat.format(now);
}

export function isOpen(item: Pick<PdiItemDto, "status">): boolean {
  return item.status === "planned" || item.status === "in_progress";
}

export function isOverdue(item: Pick<PdiItemDto, "status" | "dueDate">, today: string): boolean {
  return isOpen(item) && item.dueDate !== null && item.dueDate < today;
}

export function formatDay(day: string | null): string {
  if (!day) return "—";
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year}`;
}

// Abertos primeiro (prazo mais próximo na frente, sem prazo por último), depois concluídos e cancelados.
export function sortItems(items: PdiItemDto[]): PdiItemDto[] {
  const rank = (item: PdiItemDto) => (isOpen(item) ? 0 : item.status === "done" ? 1 : 2);
  return [...items].sort((a, b) => {
    const byGroup = rank(a) - rank(b);
    if (byGroup !== 0) return byGroup;
    if (a.dueDate !== b.dueDate) return a.dueDate === null ? 1 : b.dueDate === null ? -1 : a.dueDate < b.dueDate ? -1 : 1;
    return a.createdAt < b.createdAt ? -1 : 1;
  });
}

export function itemCounts(items: PdiItemDto[], today: string) {
  return {
    open: items.filter(isOpen).length,
    overdue: items.filter((item) => isOverdue(item, today)).length,
    done: items.filter((item) => item.status === "done").length,
  };
}
