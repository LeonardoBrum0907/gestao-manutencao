import { DomainError } from "../../kernel/domain-error";

export type PdiLines = { sponsor: string[]; development: string[] };

// Padrinho é quem responde pela linha; desenvolvimento é quem ainda está aprendendo. Não dá para ser os dois.
export function normalizePdiLines(input: PdiLines): PdiLines {
  const sponsor = [...new Set(input.sponsor)];
  const development = [...new Set(input.development)];
  if (sponsor.some((id) => development.includes(id))) {
    throw new DomainError("pdi_overlap", 400, "A mesma linha não pode ser de padrinho e de desenvolvimento.");
  }
  return { sponsor, development };
}
