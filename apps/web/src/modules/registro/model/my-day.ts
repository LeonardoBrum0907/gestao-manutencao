import type { BoardItemDto } from "@manutencao/shared";
import { dueDay } from "./board";

export type MyDayGroups = { overdue: string[]; today: string[]; doneToday: string[] };

/**
 * Divide o checklist de tarefas nas três partes do Meu Dia: atrasadas, as de hoje e as concluídas hoje
 * (no fuso do gestor). Tarefa sem prazo ou de outro dia fica de fora: ela está na Agenda.
 * @example myDayGroups(board.items, board.today) // { overdue: ["t1"], today: ["t3", "t4"], doneToday: ["t9"] }
 */
export function myDayGroups(items: readonly BoardItemDto[], today: string): MyDayGroups {
  const ids = (keep: (item: BoardItemDto) => boolean) => items.filter(keep).map((item) => item.id);
  return {
    overdue: ids((item) => item.group === "overdue"),
    today: ids((item) => item.group === "today"),
    doneToday: ids((item) => item.group === "done" && item.completedAt !== null && dueDay(item.completedAt) === today),
  };
}

const longDay = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });

/** Data por extenso para o título do Meu Dia. Ex.: `myDayDate("2026-10-13")` → `"Terça-feira, 13 de outubro"`. */
export function myDayDate(today: string): string {
  const text = longDay.format(new Date(`${today}T12:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}
