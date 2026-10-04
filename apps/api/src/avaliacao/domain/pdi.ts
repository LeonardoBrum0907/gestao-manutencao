import { DomainError } from "../../kernel/domain-error";

export type PdiMachines = { sponsor: string[]; development: string[] };

// Padrinho é quem responde pela máquina; desenvolvimento é quem ainda está aprendendo. Não dá para ser os dois.
export function normalizePdiMachines(input: PdiMachines): PdiMachines {
  const sponsor = [...new Set(input.sponsor)];
  const development = [...new Set(input.development)];
  if (sponsor.some((id) => development.includes(id))) {
    throw new DomainError("pdi_overlap", 400, "A mesma máquina não pode ser de padrinho e de desenvolvimento.");
  }
  return { sponsor, development };
}
