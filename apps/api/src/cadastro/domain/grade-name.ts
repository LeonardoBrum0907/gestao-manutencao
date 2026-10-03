import { DomainError } from "../../kernel/domain-error";

export function assertGradeNameAvailable(ownerId: string | null, currentId: string | null): void {
  if (ownerId && ownerId !== currentId) {
    throw new DomainError("grade_name_taken", 409, "Já existe um grau com esse nome.");
  }
}
