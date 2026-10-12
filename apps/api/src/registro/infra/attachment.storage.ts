import { randomUUID } from "crypto";
import { copyFile, mkdir, rename, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { Injectable } from "@nestjs/common";
import { EnvService } from "../../env.module";
import { DomainError } from "../../kernel/domain-error";

function safeFileName(originalName: string): string {
  return originalName.replace(/[^\w.\- ()]/g, "_").slice(0, 180) || "anexo";
}

@Injectable()
export class AttachmentStorage {
  constructor(private readonly env: EnvService) {}

  async save(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<{
    storageKey: string;
    fileName: string;
    mimeType: string;
  }> {
    await mkdir(this.env.attachmentDir, { recursive: true });
    const storageKey = randomUUID();
    await writeFile(join(this.env.attachmentDir, storageKey), file.buffer);
    return {
      storageKey,
      fileName: safeFileName(file.originalname),
      mimeType: file.mimetype || "application/octet-stream",
    };
  }

  // Arquivo grande que o multer já gravou em disco (documentos técnicos de até 200 MB): move em vez de
  // passar pela memória. rename falha entre discos diferentes; aí copia e apaga o temporário.
  async adopt(file: { path: string; originalname: string; mimetype: string }): Promise<{
    storageKey: string;
    fileName: string;
    mimeType: string;
  }> {
    await mkdir(this.env.attachmentDir, { recursive: true });
    const storageKey = randomUUID();
    const target = join(this.env.attachmentDir, storageKey);
    await rename(file.path, target).catch(() => copyFile(file.path, target).then(() => unlink(file.path)));
    return { storageKey, fileName: safeFileName(file.originalname), mimeType: file.mimetype || "application/octet-stream" };
  }

  pathFor(storageKey: string): string {
    if (!/^[\w-]+$/.test(storageKey)) {
      throw new DomainError("bad_key", 400, "Anexo inválido.");
    }
    return join(this.env.attachmentDir, storageKey);
  }

  async remove(storageKey: string): Promise<void> {
    await unlink(this.pathFor(storageKey)).catch(() => undefined);
  }
}
