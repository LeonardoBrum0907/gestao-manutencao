import { Inject, Injectable } from "@nestjs/common";
import type { ChamadoDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { chamadoTask, openChamado, type ChamadoWrite } from "../domain/shift";
import { ChamadoRepository } from "../infra/chamado.repository";
import { parseChamado, parseChamadoList, parseChamadoTask, type ChamadoListQuery } from "./parse-shift";

@Injectable()
export class Chamados {
  constructor(
    private readonly chamados: ChamadoRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  list(query: ChamadoListQuery): Promise<ChamadoDto[]> {
    return this.chamados.list(parseChamadoList(query));
  }

  async get(id: string): Promise<ChamadoDto> {
    const found = await this.chamados.find(id);
    if (!found) throw new DomainError("not_found", 404, "Chamado não encontrado.");
    return found;
  }

  async open(body: unknown): Promise<ChamadoDto> {
    const write = openChamado(parseChamado(body));
    await this.assertRefs(write);
    return this.chamados.insert(write);
  }

  async edit(id: string, body: unknown): Promise<ChamadoDto> {
    const current = await this.get(id);
    const write = openChamado(parseChamado(body));
    await this.assertRefs(write);
    return this.chamados.update(current, write);
  }

  async addTask(id: string, body: unknown, now: Date = new Date()): Promise<ChamadoDto> {
    const current = await this.get(id);
    const input = chamadoTask(parseChamadoTask(body));
    if (input.memberId && !(await this.refs.memberExists(input.memberId))) {
      throw new DomainError("member", 400, "Colaborador não encontrado.");
    }
    return this.chamados.addTask(current, input, now);
  }

  private async assertRefs(write: ChamadoWrite): Promise<void> {
    const [lineOk, membersOk, machineLine] = await Promise.all([
      write.lineId ? this.refs.lineExists(write.lineId) : true,
      this.refs.membersExist(write.memberIds),
      write.machineId ? this.chamados.machineLine(write.machineId) : null,
    ]);
    if (!lineOk) throw new DomainError("line", 400, "Linha não encontrada.");
    if (!membersOk) throw new DomainError("member", 400, "Colaborador não encontrado.");
    if (write.machineId && machineLine !== write.lineId) {
      throw new DomainError("machine", 400, "Essa máquina não é da linha escolhida.");
    }
  }
}
