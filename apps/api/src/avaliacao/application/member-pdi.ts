import { Inject, Injectable } from "@nestjs/common";
import type { AttachmentDto, MemberPdiDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { AttachmentStorage } from "../../registro/infra/attachment.storage";
import { normalizePdiMachines } from "../domain/pdi";
import { PdiRepository } from "../infra/pdi.repository";

function idList(source: Record<string, unknown>, key: string): string[] {
  const value = source[key] ?? [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new DomainError("invalid", 400, "Máquinas inválidas.");
  }
  return value;
}

@Injectable()
export class MemberPdi {
  constructor(
    private readonly pdi: PdiRepository,
    private readonly storage: AttachmentStorage,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async show(memberId: string): Promise<MemberPdiDto> {
    await this.assertMember(memberId);
    const [machines, attachments] = await Promise.all([this.pdi.machines(memberId), this.pdi.attachments(memberId)]);
    return { memberId, sponsorMachineIds: machines.sponsor, developmentMachineIds: machines.development, attachments };
  }

  async setMachines(memberId: string, body: unknown): Promise<MemberPdiDto> {
    await this.assertMember(memberId);
    const source = readObject(body);
    const machines = normalizePdiMachines({ sponsor: idList(source, "sponsor"), development: idList(source, "development") });
    for (const id of [...machines.sponsor, ...machines.development]) {
      if (!(await this.refs.machineExists(id))) throw new DomainError("machine", 400, "Máquina não encontrada.");
    }
    await this.pdi.replaceMachines(memberId, machines);
    return this.show(memberId);
  }

  async addAttachment(memberId: string, file: Express.Multer.File | undefined): Promise<AttachmentDto> {
    await this.assertMember(memberId);
    if (!file || !file.buffer?.length) throw new DomainError("file", 400, "Escolha um arquivo.");
    return this.pdi.addAttachment(memberId, await this.storage.save(file));
  }

  async openAttachment(memberId: string, attachmentId: string) {
    const row = await this.pdi.findAttachment(memberId, attachmentId);
    if (!row) throw new DomainError("not_found", 404, "Anexo não encontrado.");
    return { path: this.storage.pathFor(row.storageKey), fileName: row.fileName, mimeType: row.mimeType };
  }

  async removeAttachment(memberId: string, attachmentId: string): Promise<void> {
    const row = await this.pdi.findAttachment(memberId, attachmentId);
    if (!row) throw new DomainError("not_found", 404, "Anexo não encontrado.");
    await this.storage.remove(row.storageKey);
    await this.pdi.removeAttachment(row.id);
  }

  private async assertMember(id: string): Promise<void> {
    if (!(await this.refs.memberExists(id))) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
  }
}
