import type { MatrixCatalogDto, TransferPersonDto, TransferSummaryDto } from "@manutencao/shared";
import { masteredSkills, progressOf, type ScoreBook } from "../domain/transfer-progress";
import type { TransferMember } from "../domain/transfer-rules";
import { isStale, lastProgressAt, type ScoreChange } from "../domain/transfer-timeline";
import type { MemberChangeRow, MemberScoreRow, TransferRow } from "./transfer-store";

/** Tudo o que a montagem de um repasse precisa, carregado uma vez para a lista toda. */
export type TransferContext = {
  catalog: MatrixCatalogDto;
  people: ReadonlyMap<string, TransferMember>;
  books: ReadonlyMap<string, ScoreBook>;
  history: ReadonlyMap<string, ScoreChange[]>;
  now: Date;
};

const EMPTY_BOOK: ScoreBook = new Map();

/**
 * Agrupa as notas por pessoa.
 * @example booksByMember(rows).get("m1")?.get("s1") // { score: 3, notApplicable: false }
 */
export function booksByMember(rows: readonly MemberScoreRow[]): Map<string, ScoreBook> {
  const books = new Map<string, Map<string, MemberScoreRow>>();
  for (const row of rows) {
    const book = books.get(row.memberId) ?? new Map<string, MemberScoreRow>();
    book.set(row.skillId, row);
    books.set(row.memberId, book);
  }
  return books;
}

/**
 * Agrupa o histórico das notas por pessoa.
 * @example historyByMember(rows).get("m1")?.length // 12
 */
export function historyByMember(rows: readonly MemberChangeRow[]): Map<string, ScoreChange[]> {
  const history = new Map<string, ScoreChange[]>();
  for (const row of rows) history.set(row.memberId, [...(history.get(row.memberId) ?? []), row]);
  return history;
}

/**
 * Nome e equipe de alguém do repasse; quem saiu do cadastro aparece sem nome em vez de quebrar a lista.
 * @example personOf(context, "m1").name // "Welligton"
 */
export function personOf(context: TransferContext, id: string): TransferPersonDto {
  const member = context.people.get(id);
  return { id, name: member?.name ?? "—", teamName: member?.teamName ?? null };
}

/**
 * Notas de alguém, vazias quando não tem nenhuma.
 * @example bookOf(context, "m1").size // 120
 */
export function bookOf(context: TransferContext, id: string): ScoreBook {
  return context.books.get(id) ?? EMPTY_BOOK;
}

/**
 * Linha do repasse para a lista: pessoas, repassado e se está parado.
 * @example summaryOf(row, context).progress.percent // 57
 */
export function summaryOf(row: TransferRow, context: TransferContext): TransferSummaryDto {
  const mastered = masteredSkills(context.catalog, row.equipmentIds, bookOf(context, row.teacherId));
  const lastProgress = lastProgressAt(new Set(mastered.map((skill) => skill.id)), context.history.get(row.learnerId) ?? [], row.startedAt);
  return {
    id: row.id,
    teacher: personOf(context, row.teacherId),
    learner: personOf(context, row.learnerId),
    equipmentIds: row.equipmentIds,
    status: row.status === "closed" ? "closed" : "active",
    startedAt: row.startedAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
    lastProgressAt: lastProgress.toISOString(),
    stale: isStale(lastProgress, context.now, row.status),
    progress: progressOf(mastered, bookOf(context, row.learnerId)),
  };
}
