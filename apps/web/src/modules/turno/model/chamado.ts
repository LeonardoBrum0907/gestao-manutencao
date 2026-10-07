import {
  CHAMADO_SHIFTS,
  CHAMADO_STATUS_LABELS,
  GESTOR_TIME_ZONE,
  MEMBER_SHIFT_LABELS,
  type ChamadoDto,
  type ChamadoShift,
  type RecordStatus,
} from "@manutencao/shared";

export function shiftLabel(shift: ChamadoShift): string {
  return MEMBER_SHIFT_LABELS[shift];
}

export const shiftChoices = CHAMADO_SHIFTS.map((shift) => ({ value: shift, short: shift === "first" ? "1º" : shift === "second" ? "2º" : "3º" }));

// Liberado, Pendente e Em andamento: os nomes do SIGEM, na ordem em que se usa no turno.
export const chamadoStatusChoices: { value: RecordStatus; label: string }[] = (["done", "open", "in_progress"] as const).map((status) => ({
  value: status,
  label: CHAMADO_STATUS_LABELS[status],
}));

export function chamadoStatusLabel(status: RecordStatus): string {
  return CHAMADO_STATUS_LABELS[status];
}

export function chamadoStatusChipClass(status: RecordStatus): string {
  if (status === "open") return "rounded-control bg-danger-soft px-2 py-1 text-xs font-semibold text-danger";
  if (status === "in_progress") return "rounded-control bg-accent-soft px-2 py-1 text-xs font-semibold text-accent";
  return "rounded-control bg-chip px-2 py-1 text-xs font-medium text-muted";
}

// Turno sugerido pela hora da abertura (06h, 14h e 22h); dá para trocar no painel.
export function suggestShift(date: Date): ChamadoShift {
  const hour = date.getHours();
  if (hour >= 6 && hour < 14) return "first";
  if (hour >= 14 && hour < 22) return "second";
  return "third";
}

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const titleFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "2-digit" });
const shortFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
const clockFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: GESTOR_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

// Dia "AAAA-MM-DD" no fuso do gestor, o mesmo que a API usa para numerar.
export function dayOf(date: Date): string {
  return dayFormat.format(date);
}

export function today(): string {
  return dayOf(new Date());
}

export function addDays(day: string, amount: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + amount)).toISOString().slice(0, 10);
}

function utcNoon(day: string): Date {
  return new Date(`${day}T12:00:00.000Z`);
}

// "Hoje, qua. 07/10", "Ontem, ter. 06/10" ou "seg. 05/10".
export function dayTitle(day: string): string {
  const label = titleFormat.format(utcNoon(day));
  if (day === today()) return `Hoje, ${label}`;
  if (day === addDays(today(), -1)) return `Ontem, ${label}`;
  return label;
}

export function shortDay(day: string): string {
  return shortFormat.format(utcNoon(day));
}

export function clock(iso: string | null): string {
  return iso ? clockFormat.format(new Date(iso)) : "";
}

export function hours(chamado: Pick<ChamadoDto, "openedAt" | "closedAt" | "occurredAt">): string {
  const opened = clock(chamado.openedAt ?? chamado.occurredAt);
  return `${opened} – ${chamado.closedAt ? clock(chamado.closedAt) : "…"}`;
}

// Dia e hora digitados no painel viram o instante. Fechamento antes da abertura é do dia seguinte (3º turno).
export function instant(day: string, time: string): Date {
  return new Date(`${day}T${time}:00`);
}

export function closingInstant(day: string, opened: string, closed: string): Date {
  const open = instant(day, opened);
  const close = instant(day, closed);
  return close.getTime() < open.getTime() ? instant(addDays(day, 1), closed) : close;
}

export function nowClock(): string {
  return clock(new Date().toISOString());
}

// Abre a lista do dia do chamado já com o painel dele aberto.
export function chamadoHref(chamado: Pick<ChamadoDto, "id" | "day">): string {
  return `/turno/chamados?dia=${chamado.day}&abrir=${chamado.id}`;
}
