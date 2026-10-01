import { DomainError } from "../../kernel/domain-error";

export function assertRoleNameAvailable(ownerId: string | null, currentId: string | null): void {
  if (ownerId && ownerId !== currentId) {
    throw new DomainError("role_name_taken", 409, "Já existe uma função com esse nome.");
  }
}
