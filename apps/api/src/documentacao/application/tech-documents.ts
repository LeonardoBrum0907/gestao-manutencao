import { Injectable } from "@nestjs/common";
import type { TechDocumentDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";
import { AttachmentStorage } from "../../registro/infra/attachment.storage";
import { assertDocumentCanBeRemoved, assertDocumentFile, readTechDocumentFields } from "../domain/tech-document";
import { TechDocumentRepository } from "../infra/tech-document.repository";

// O que o multer entrega quando grava em disco (documentos grandes não passam pela memória).
export type DiskUpload = { path: string; originalname: string; mimetype: string; size: number };

export type OpenFile = { path: string; fileName: string; mimeType: string };

@Injectable()
export class TechDocuments {
  constructor(
    private readonly documents: TechDocumentRepository,
    private readonly storage: AttachmentStorage,
  ) {}

  list(equipmentId: string | null): Promise<TechDocumentDto[]> {
    return this.documents.list(equipmentId);
  }

  async get(id: string): Promise<TechDocumentDto> {
    const found = await this.documents.find(id);
    if (!found) throw new DomainError("not_found", 404, "Documento não encontrado.");
    return found;
  }

  async upload(body: unknown, file: DiskUpload | undefined): Promise<TechDocumentDto> {
    const fields = readTechDocumentFields(readObject(body));
    const upload = assertDocumentFile(file);
    if (!(await this.documents.equipmentExists(fields.equipmentId))) {
      throw new DomainError("equipment", 400, "Modelo de equipamento não encontrado.");
    }
    const stored = await this.storage.adopt(upload as DiskUpload);
    return this.documents.create(fields, { ...stored, size: upload.size });
  }

  async update(id: string, body: unknown): Promise<TechDocumentDto> {
    const current = await this.get(id);
    const fields = readTechDocumentFields({ ...readObject(body), equipmentId: current.equipmentId });
    return this.documents.update(id, fields);
  }

  async checkRemoval(id: string): Promise<void> {
    const current = await this.get(id);
    assertDocumentCanBeRemoved(current.cardCount);
  }

  async remove(id: string): Promise<void> {
    await this.checkRemoval(id);
    const current = await this.documents.find(id);
    if (!current) return;
    await this.documents.remove(id);
    await this.storage.remove(current.storageKey);
  }

  async openFile(id: string): Promise<OpenFile> {
    const current = await this.documents.find(id);
    if (!current) throw new DomainError("not_found", 404, "Documento não encontrado.");
    return { path: this.storage.pathFor(current.storageKey), fileName: current.fileName, mimeType: current.mimeType };
  }
}
