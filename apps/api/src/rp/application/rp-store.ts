import type {
  RpDto,
  RpDuplicateDto,
  RpFields,
  RpListItemDto,
  RpPageDto,
  RpSource,
} from "@manutencao/shared";
import type { RpListFilter } from "../domain/rp-list";
import type { RpDecisionPatch } from "../domain/rp-decision";

export type RpWrite = {
  fields: RpFields;
  occurredAt: Date;
  rawText: string;
  problemRecordId: string | null;
};

/**
 * Onde os RPs ficam gravados. O Postgres é o RpRepository; os testes usam o FakeRpStore.
 * @example const rp = await store.insert(write, null, "paste")
 */
export interface RpStore {
  find(id: string): Promise<RpDto | null>;
  // Chamado que pode receber o RP: existe e ainda não tem RP.
  chamadoFree(chamadoId: string): Promise<"missing" | "taken" | "free">;
  idByProblem(problemRecordId: string): Promise<string | null>;
  insert(write: RpWrite, chamadoId?: string | null, origin?: RpSource): Promise<RpDto>;
  update(id: string, write: RpWrite): Promise<RpDto>;
  remove(id: string): Promise<void>;
  setDecision(id: string, patch: RpDecisionPatch): Promise<RpDto>;
  listPage(filter: RpListFilter): Promise<RpPageDto>;
  memberSummary(memberId: string, limit: number): Promise<{ count: number; items: RpListItemDto[] }>;
  duplicates(fields: RpFields, occurredAt: Date, excludeId: string | null): Promise<RpDuplicateDto[]>;
}
