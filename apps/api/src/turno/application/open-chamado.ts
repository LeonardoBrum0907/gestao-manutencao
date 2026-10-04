import { Inject, Injectable } from "@nestjs/common";
import type { RecordDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { PROBLEM_LOG, type ProblemLogPort, type ProblemWrite } from "../../ports/problem-log";
import { openChamado } from "../domain/shift";
import { parseChamado } from "./parse-shift";

@Injectable()
export class OpenChamado {
  constructor(
    @Inject(PROBLEM_LOG) private readonly problems: ProblemLogPort,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async execute(body: unknown, now: Date = new Date()): Promise<RecordDto> {
    const write = openChamado(parseChamado(body), now);
    await this.assertRefs(write);
    return this.problems.save(write);
  }

  async replace(id: string, body: unknown): Promise<RecordDto> {
    const current = await this.problems.find(id);
    if (!current) throw new DomainError("not_found", 404, "Registro não encontrado.");
    const write = openChamado(parseChamado(body), new Date(current.occurredAt));
    await this.assertRefs(write);
    return this.problems.replace(id, write);
  }

  private async assertRefs(write: ProblemWrite): Promise<void> {
    if (write.machineId && !(await this.refs.machineExists(write.machineId))) {
      throw new DomainError("machine", 400, "Máquina não encontrada.");
    }
    for (const id of write.memberIds) {
      if (!(await this.refs.memberExists(id))) {
        throw new DomainError("member", 400, "Colaborador não encontrado.");
      }
    }
  }
}
