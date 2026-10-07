import { Inject, Injectable } from "@nestjs/common";
import type { RecordDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { PROBLEM_LOG, type ProblemLogPort } from "../../ports/problem-log";
import { noteOcorrencia } from "../domain/shift";
import { parseOcorrencia } from "./parse-shift";

@Injectable()
export class NoteOcorrencia {
  constructor(
    @Inject(PROBLEM_LOG) private readonly problems: ProblemLogPort,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async replace(id: string, body: unknown): Promise<RecordDto> {
    const input = parseOcorrencia(body);
    return this.problems.replace(id, async (current) => {
      const write = noteOcorrencia(input, new Date(current.occurredAt));
      await this.assertFactory(write.factoryId);
      return write;
    });
  }

  private async assertFactory(id: string | null): Promise<void> {
    if (!id || !(await this.refs.factoryExists(id))) {
      throw new DomainError("factory", 400, "Fábrica não encontrada.");
    }
  }
}
