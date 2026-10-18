import type { RpSource, RpStatus } from "@manutencao/shared";

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export type RpListFilter = {
  from: string | null;
  to: string | null;
  factoryId: string | null;
  lineId: string | null;
  line: string | null;
  tag: string | null;
  statuses: RpStatus[] | null;
  memberId: string | null;
  repeated: boolean | null;
  source: RpSource | null;
  // Só os que têm pedido de revisão em aberto.
  reviewPending: boolean;
  // RP da página pública conferido (aprovado) pelo coordenador; null: todos.
  checked: boolean | null;
  q: string | null;
  cursor: string | null;
  limit: number;
};
