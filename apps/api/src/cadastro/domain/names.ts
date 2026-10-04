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
