import { Injectable } from "@nestjs/common";
import type { RecordDto } from "@manutencao/shared";
import { matchesFollowUp, type FollowUpFilter } from "../domain/follow-up";
import { RecordRepository } from "../infra/record.repository";

@Injectable()
export class FollowUpList {
  constructor(private readonly records: RecordRepository) {}

  async execute(filter: FollowUpFilter, now: Date = new Date()): Promise<RecordDto[]> {
    const rows = await this.records.list();
    return rows.filter((row) =>
      matchesFollowUp(
        {
          type: row.type,
          status: row.status,
          dueAt: row.dueAt ? new Date(row.dueAt) : null,
        },
        filter,
        now,
      ),
    );
  }
}
