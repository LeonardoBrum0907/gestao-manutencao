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
    const input = parseChamado(body);
    return this.problems.replace(id, async (current) => {
      const write = openChamado(input, new Date(current.occurredAt));
      await this.assertRefs(write);
      return write;
    });
  }

  private async assertRefs(write: ProblemWrite): Promise<void> {
    const [lineOk, membersOk] = await Promise.all([
      write.lineId ? this.refs.lineExists(write.lineId) : true,
      this.refs.membersExist(write.memberIds),
    ]);
    if (!lineOk) throw new DomainError("line", 400, "Linha não encontrada.");
    if (!membersOk) throw new DomainError("member", 400, "Colaborador não encontrado.");
  }
}
