import { Inject, Injectable } from "@nestjs/common";
import type { AttachmentDto, RecordDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { captureRecord } from "../domain/capture";
import type { RecordState } from "../domain/record-state";
import { applyFeedbackSheet, applyProblemSheet, applyTaskSheet } from "../domain/sheets";
import { AttachmentStorage } from "../infra/attachment.storage";
import { RecordRepository } from "../infra/record.repository";
import { parseCapture, parseFeedbackSheet, parseProblemSheet, parseTaskSheet } from "./parse-record";

function dtoToState(dto: RecordDto): RecordState {
  return {
    type: dto.type,
    body: dto.body,
    occurredAt: new Date(dto.occurredAt),
    status: dto.status,
    technicianId: dto.technicianId,
    factoryId: dto.factoryId,
    machineId: dto.machineId,
    machineLabel: dto.machineLabel,
    tag: dto.tag,
    line: dto.line,
    priority: dto.priority,
    dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
    notes: dto.notes,
    origin: dto.origin,
  };
}

@Injectable()
export class Records {
  constructor(
    private readonly records: RecordRepository,
    private readonly storage: AttachmentStorage,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async get(id: string): Promise<RecordDto> {
    const row = await this.records.find(id);
    if (!row) throw new DomainError("not_found", 404, "Registro não encontrado.");
    return row;
  }

  async capture(body: unknown): Promise<RecordDto> {
    const input = parseCapture(body);
    await this.assertTechnician(input.technicianId);
    return this.records.insert(captureRecord(input));
  }

  async updateSheet(id: string, body: unknown): Promise<RecordDto> {
    const current = await this.get(id);
    const state = dtoToState(current);
    if (current.type === "task") {
      const input = parseTaskSheet(body);
      await this.assertTechnician(input.technicianId);
      await this.assertFactory(input.factoryId);
      return this.records.update(id, applyTaskSheet(state, input));
    }
    if (current.type === "feedback") {
      const input = parseFeedbackSheet(body);
      await this.assertTechnician(input.technicianId);
      return this.records.update(id, applyFeedbackSheet(state, input));
    }
    const input = parseProblemSheet(body);
    await this.assertTechnician(input.technicianId);
    await this.assertMachine(input.machineId);
    return this.records.update(id, applyProblemSheet(state, input));
  }

  async addAttachment(id: string, file: Express.Multer.File | undefined): Promise<AttachmentDto> {
    if (!file || !file.buffer?.length) {
      throw new DomainError("file", 400, "Escolha um arquivo.");
    }
    const current = await this.get(id);
    if (current.type !== "task") {
      throw new DomainError("attachment", 400, "Anexo fica só na tarefa.");
    }
    const stored = await this.storage.save(file);
    return this.records.addAttachment(id, stored);
  }

  async openAttachment(recordId: string, attachmentId: string) {
    const row = await this.records.findAttachment(recordId, attachmentId);
    if (!row) throw new DomainError("not_found", 404, "Anexo não encontrado.");
    return { path: this.storage.pathFor(row.storageKey), fileName: row.fileName, mimeType: row.mimeType };
  }

  async removeAttachment(recordId: string, attachmentId: string): Promise<void> {
    const row = await this.records.findAttachment(recordId, attachmentId);
    if (!row) throw new DomainError("not_found", 404, "Anexo não encontrado.");
    await this.storage.remove(row.storageKey);
    await this.records.removeAttachment(recordId, attachmentId);
  }

  private async assertTechnician(id: string | null): Promise<void> {
    if (!id) return;
    if (!(await this.refs.technicianExists(id))) {
      throw new DomainError("technician", 400, "Técnico não encontrado.");
    }
  }

  private async assertFactory(id: string | null): Promise<void> {
    if (!id) return;
    if (!(await this.refs.factoryExists(id))) {
      throw new DomainError("factory", 400, "Fábrica não encontrada.");
    }
  }

  private async assertMachine(id: string | null): Promise<void> {
    if (!id) return;
    if (!(await this.refs.machineExists(id))) {
      throw new DomainError("machine", 400, "Máquina não encontrada.");
    }
  }
}
