import type { DueWindow, RecordStatus, RecordType } from "@manutencao/shared";

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export type RecordListFilter = {
  types: RecordType[] | null;
  statuses: RecordStatus[] | null;
  due: DueWindow | null;
  lineIds: string[] | null;
  memberId: string | null;
  cursor: string | null;
  limit: number;
};
