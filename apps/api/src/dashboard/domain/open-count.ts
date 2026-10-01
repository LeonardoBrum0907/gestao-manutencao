import type { RecordStatus } from "@manutencao/shared";

export const OPEN_RECORD_STATUS = "open" satisfies RecordStatus;

export function countsAsOpen(status: RecordStatus): boolean {
  return status === OPEN_RECORD_STATUS;
}
