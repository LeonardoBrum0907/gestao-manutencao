import type { MemberRecordSummaryDto, RecordOrigin, RecordStatus, RecordType } from "@manutencao/shared";
import { taskDueWindow } from "./follow-up";

export type MemberRecordSubject = {
  type: RecordType;
  status: RecordStatus;
  origin: RecordOrigin;
  dueAt: Date | null;
  occurredAt: Date;
  memberId: string | null;
  memberIds: string[];
};

// A pessoa aparece no registro como responsável/alvo ou entre os técnicos do chamado.
export function involves(record: Pick<MemberRecordSubject, "memberId" | "memberIds">, memberId: string): boolean {
  return record.memberId === memberId || record.memberIds.includes(memberId);
}

export function isOverdue(record: Pick<MemberRecordSubject, "type" | "status" | "dueAt">, now: Date): boolean {
  return record.type === "task" && record.status !== "done" && record.dueAt !== null && taskDueWindow(record.dueAt, now) === "overdue";
}

// Feedback é anotação sobre a pessoa, não pendência: não abre nem fecha, conta à parte.
export function summarizeMemberRecords(records: MemberRecordSubject[], now: Date): MemberRecordSummaryDto {
  const pending = records.filter((record) => record.type !== "feedback");
  return {
    open: pending.filter((record) => record.status !== "done").length,
    overdue: pending.filter((record) => isOverdue(record, now)).length,
    done: pending.filter((record) => record.status === "done").length,
    chamados: records.filter((record) => record.origin === "chamado").length,
    feedbacks: records.filter((record) => record.type === "feedback").length,
  };
}

// Primeiro o que está aberto, e dentro de cada grupo o mais recente.
export function sortForProfile<T extends Pick<MemberRecordSubject, "status" | "occurredAt">>(records: T[]): T[] {
  return [...records].sort(
    (a, b) =>
      Number(a.status === "done") - Number(b.status === "done") || b.occurredAt.getTime() - a.occurredAt.getTime(),
  );
}
