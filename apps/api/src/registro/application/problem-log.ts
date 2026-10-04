import { Injectable } from "@nestjs/common";
import type { RecordDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import type { ProblemLogPort, ProblemWrite } from "../../ports/problem-log";
import { problemFromShift } from "../domain/shift-problem";
import { RecordRepository } from "../infra/record.repository";

@Injectable()
export class ProblemLog implements ProblemLogPort {
  constructor(private readonly records: RecordRepository) {}

  save(write: ProblemWrite): Promise<RecordDto> {
    return this.records.insert(problemFromShift(write));
  }

  async replace(id: string, build: (current: RecordDto) => ProblemWrite | Promise<ProblemWrite>): Promise<RecordDto> {
    const current = await this.records.find(id);
    if (!current) throw new DomainError("not_found", 404, "Registro não encontrado.");
    const write = await build(current);
    if (current.type !== "problem" || current.origin !== write.origin) {
      throw new DomainError("wrong_origin", 400, "Este registro não é desse turno.");
    }
    return this.records.update(id, problemFromShift(write), current.memberIds);
  }
}
