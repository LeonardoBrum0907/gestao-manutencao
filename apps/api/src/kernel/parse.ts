import { DomainError } from "./domain-error";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readObject(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new DomainError("invalid", 400, "Dados inválidos.");
  }
  return value;
}

export function requiredString(source: Record<string, unknown>, key: string, message: string): string {
  const value = source[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new DomainError("invalid", 400, message);
  }
  return value.trim();
}

export function optionalString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") {
    throw new DomainError("invalid", 400, "Dados inválidos.");
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function requiredDate(source: Record<string, unknown>, key: string, message: string): Date {
  const value = source[key];
  if (typeof value !== "string") {
    throw new DomainError("invalid", 400, message);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new DomainError("invalid", 400, message);
  }
  return date;
}

export function optionalDate(source: Record<string, unknown>, key: string): Date | null {
  const value = source[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") {
    throw new DomainError("invalid", 400, "Data inválida.");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new DomainError("invalid", 400, "Data inválida.");
  }
  return date;
}

export function requiredBoolean(source: Record<string, unknown>, key: string): boolean {
  const value = source[key];
  if (typeof value !== "boolean") {
    throw new DomainError("invalid", 400, "Dados inválidos.");
  }
  return value;
}
