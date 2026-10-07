import { Inject, Injectable } from "@nestjs/common";
import type { PostPreventiveDto, PostPreventiveFields } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { assertSubassemblyFits, parseDay, readPostPreventive } from "../domain/post-preventive";
import { PostPreventiveRepository, type PostPreventiveFilter } from "../infra/post-preventive.repository";

export type PostPreventiveQuery = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string | null {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() || null;
}

export function parseFilter(query: PostPreventiveQuery): PostPreventiveFilter {
  return {
    lineId: single(query.lineId),
    machineId: single(query.machineId),
    subassemblyId: single(query.subassemblyId),
    memberId: single(query.memberId),
    rpId: single(query.rpId),
    activeOnly: single(query.active) === "true",
    from: parseDay(single(query.from), "Data inicial inválida."),
    to: parseDay(single(query.to), "Data final inválida."),
  };
}

@Injectable()
export class PostPreventives {
  constructor(
    private readonly repository: PostPreventiveRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  list(query: PostPreventiveQuery): Promise<PostPreventiveDto[]> {
    return this.repository.list(parseFilter(query));
  }

  async get(id: string): Promise<PostPreventiveDto> {
    const found = await this.repository.find(id);
    if (!found) throw new DomainError("not_found", 404, "Ficha não encontrada.");
    return found;
  }

  async create(body: unknown): Promise<PostPreventiveDto> {
    const fields = readPostPreventive(readObject(body));
    await this.assertRefs(fields, null);
    return this.repository.create(fields);
  }

  async update(id: string, body: unknown): Promise<PostPreventiveDto> {
    const current = await this.get(id);
    const fields = readPostPreventive(readObject(body));
    await this.assertRefs(fields, current.subassemblyId);
    return this.repository.update(id, fields);
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await this.repository.remove(id);
  }

  private async assertRefs(fields: PostPreventiveFields, currentSubassemblyId: string | null): Promise<void> {
    const [machine, subassembly, membersOk, rpOk] = await Promise.all([
      this.repository.findMachine(fields.machineId),
      this.repository.findSubassembly(fields.subassemblyId),
      this.refs.membersExist(fields.memberIds),
      fields.rpId ? this.repository.rpExists(fields.rpId) : Promise.resolve(true),
    ]);
    if (!machine) throw new DomainError("machine", 400, "Máquina não encontrada.");
    if (!subassembly) throw new DomainError("subassembly", 400, "Subconjunto não encontrado.");
    assertSubassemblyFits(machine, subassembly, currentSubassemblyId);
    if (!membersOk) throw new DomainError("members", 400, "Técnico não encontrado.");
    if (!rpOk) throw new DomainError("rp", 400, "RP não encontrado.");
  }
}
