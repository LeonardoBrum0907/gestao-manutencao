import { plain } from "./rp-match";

export function normalizeOrder(order: string | null): string | null {
  const value = order ? order.replace(/[^a-z0-9]/gi, "").toLowerCase() : "";
  return value || null;
}

export function normalizeProblem(problem: string): string {
  return plain(problem).replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Meio-dia UTC: a data do relatório não muda de dia em nenhum fuso do Brasil.
export function rpDate(day: string): Date {
  return new Date(`${day}T12:00:00.000Z`);
}
