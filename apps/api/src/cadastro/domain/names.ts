import {
  isMachineStatus,
  isTechnicianShift,
  isTechnicianStatus,
  type MachineOperationalStatus,
  type TechnicianShift,
  type TechnicianStatus,
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

export function requireShift(value: string): TechnicianShift {
  if (!isTechnicianShift(value)) {
    throw new DomainError("invalid", 400, "Turno inválido.");
  }
  return value;
}

export function requireTechnicianStatus(value: string): TechnicianStatus {
  if (!isTechnicianStatus(value)) {
    throw new DomainError("invalid", 400, "Status do técnico inválido.");
  }
  return value;
}
