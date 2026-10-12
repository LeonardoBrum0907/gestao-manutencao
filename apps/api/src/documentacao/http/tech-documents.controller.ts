import { createReadStream } from "fs";
import { tmpdir } from "os";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { TECH_DOCUMENT_MAX_BYTES } from "@manutencao/shared";
import { diskStorage } from "multer";
import { inlineDisposition } from "../../http/file-disposition";
import { removalCheck } from "../../kernel/removal";
import { TechDocuments } from "../application/tech-documents";

@Controller("api/tech-documents")
export class TechDocumentsController {
  constructor(private readonly documents: TechDocuments) {}

  @Get()
  list(@Query("equipmentId") equipmentId?: string) {
    return this.documents.list(equipmentId?.trim() || null);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.documents.get(id);
  }

  // Manuais chegam a centenas de MB: o multer grava no disco temporário e o storage move para a pasta de anexos.
  @Post()
  @UseInterceptors(FileInterceptor("file", { storage: diskStorage({ destination: tmpdir() }), limits: { fileSize: TECH_DOCUMENT_MAX_BYTES } }))
  upload(@Body() body: unknown, @UploadedFile() file: Express.Multer.File | undefined) {
    return this.documents.upload(body, file);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.documents.update(id, body);
  }

  @Get(":id/removal")
  removal(@Param("id") id: string) {
    return removalCheck(() => this.documents.checkRemoval(id));
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.documents.remove(id);
    return { ok: true };
  }

  // Abre no navegador; a ficha manda a página no #page=N do endereço.
  @Get(":id/file")
  async open(@Param("id") id: string) {
    const file = await this.documents.openFile(id);
    return new StreamableFile(createReadStream(file.path), { type: file.mimeType, disposition: inlineDisposition(file.fileName) });
  }
}
