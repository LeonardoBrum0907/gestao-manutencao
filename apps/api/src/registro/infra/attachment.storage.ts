import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { Injectable } from "@nestjs/common";
import { EnvService } from "../../env.module";
import { DomainError } from "../../kernel/domain-error";

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
    const fileName = file.originalname.replace(/[^\w.\- ()]/g, "_").slice(0, 180) || "anexo";
    return {
      storageKey,
      fileName,
      mimeType: file.mimetype || "application/octet-stream",
    };
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
