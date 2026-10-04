import type { RecordStatus, RecordType } from "@manutencao/shared";
import { matchesFollowUp, type FollowUpFilter } from "../../registro/domain/follow-up";
import { countsAsOpen } from "./open-count";

export const RECENT_LIMIT = 5;
export const RANK_LIMIT = 5;

export type PanelRecord = {
  id: string;
  type: RecordType;
  status: RecordStatus;
  dueAt: Date | null;
  body: string;
  occurredAt: Date;
  createdAt: Date;
  machineId: string | null;
  memberId: string | null;
};

export type PanelRank = {
  id: string;
  name: string;
  openCount: number;
};

export type RecordPanel = {
  openCount: number;
  overdueCount: number;
  dueTodayCount: number;
  doneCount: number;
  recent: PanelRecord[];
  machineRanking: PanelRank[];
  memberRanking: PanelRank[];
};

const openFilter: FollowUpFilter = { type: null, status: "open", due: null };
const overdueFilter: FollowUpFilter = { type: null, status: null, due: "overdue" };
const todayFilter: FollowUpFilter = { type: null, status: null, due: "today" };
const doneFilter: FollowUpFilter = { type: null, status: "done", due: null };

function countMatching(records: PanelRecord[], filter: FollowUpFilter, now: Date): number {
  return records.filter((record) =>
    matchesFollowUp(
      { type: record.type, status: record.status, dueAt: record.dueAt },
      filter,
      now,
    ),
  ).length;
}

function rankOpen(
  records: PanelRecord[],
  pick: (record: PanelRecord) => string | null,
  names: Map<string, string>,
): PanelRank[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    if (!countsAsOpen(record.status)) continue;
    const id = pick(record);
    if (!id || !names.has(id)) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, openCount]) => ({ id, name: names.get(id) ?? "", openCount }))
    .sort((a, b) => b.openCount - a.openCount || a.name.localeCompare(b.name, "pt-BR"))
    .slice(0, RANK_LIMIT);
}

export function buildRecordPanel(
  records: PanelRecord[],
  names: { machines: Map<string, string>; members: Map<string, string> },
  now: Date,
): RecordPanel {
  const recent = [...records]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id))
    .slice(0, RECENT_LIMIT);
  return {
    openCount: countMatching(records, openFilter, now),
    overdueCount: countMatching(records, overdueFilter, now),
    dueTodayCount: countMatching(records, todayFilter, now),
    doneCount: countMatching(records, doneFilter, now),
    recent,
    machineRanking: rankOpen(records, (record) => record.machineId, names.machines),
    memberRanking: rankOpen(records, (record) => record.memberId, names.members),
  };
}
