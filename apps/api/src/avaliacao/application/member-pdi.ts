import { Inject, Injectable } from "@nestjs/common";
import type { AttachmentDto, MemberPdiDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { AttachmentStorage } from "../../registro/infra/attachment.storage";
import { normalizePdiLines } from "../domain/pdi";
import { PdiRepository } from "../infra/pdi.repository";

function idList(source: Record<string, unknown>, key: string): string[] {
  const value = source[key] ?? [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new DomainError("invalid", 400, "Linhas inválidas.");
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
    return this.read(memberId);
  }

  private async read(memberId: string): Promise<MemberPdiDto> {
    const [lines, attachments] = await Promise.all([this.pdi.lines(memberId), this.pdi.attachments(memberId)]);
    return { memberId, sponsorLineIds: lines.sponsor, developmentLineIds: lines.development, attachments };
  }

  async setLines(memberId: string, body: unknown): Promise<MemberPdiDto> {
    await this.assertMember(memberId);
    const source = readObject(body);
    const lines = normalizePdiLines({ sponsor: idList(source, "sponsor"), development: idList(source, "development") });
    if (!(await this.refs.linesExist([...lines.sponsor, ...lines.development]))) {
      throw new DomainError("line", 400, "Linha não encontrada.");
    }
    await this.pdi.replaceLines(memberId, lines);
    return this.read(memberId);
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
