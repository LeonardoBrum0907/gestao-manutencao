import {
  isMachineStatus,
  isMemberShift,
  isMemberStatus,
  type MachineOperationalStatus,
  type MemberShift,
  type MemberStatus,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export function requireName(value: string, message: string): string {
  const name = value.trim();
  if (!name) throw new DomainError("invalid", 400, message);
  return name;
}

/**
 * Acha o item que já usa o nome, sem diferenciar maiúscula de minúscula: "Mecânico" e "mecânico" são a mesma função.
 * Acento continua contando ("mecanico" é outro nome).
 * @example nameOwner([{ id: "r1", name: "mecânico" }], "Mecânico") // { id: "r1", name: "mecânico" }
 */
export function nameOwner<T extends { name: string }>(items: readonly T[], name: string): T | undefined {
  return items.find((item) => item.name.localeCompare(name, "pt-BR", { sensitivity: "accent" }) === 0);
}

export function requireMachineStatus(value: string): MachineOperationalStatus {
  if (!isMachineStatus(value)) {
    throw new DomainError("invalid", 400, "Status da máquina inválido.");
  }
  return value;
}

export function requireShift(value: string): MemberShift {
  if (!isMemberShift(value)) {
    throw new DomainError("invalid", 400, "Turno inválido.");
  }
  return value;
}

export function requireMemberStatus(value: string): MemberStatus {
  if (!isMemberStatus(value)) {
    throw new DomainError("invalid", 400, "Status do colaborador inválido.");
  }
  return value;
}
