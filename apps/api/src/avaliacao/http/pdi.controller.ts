import { createReadStream } from "fs";
import { Body, Controller, Delete, Get, Param, Post, Put, StreamableFile, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { MemberPdi } from "../application/member-pdi";

@Controller("api/members/:memberId/pdi")
export class PdiController {
  constructor(private readonly pdi: MemberPdi) {}

  @Get()
  show(@Param("memberId") memberId: string) {
    return this.pdi.show(memberId);
  }

  @Put("machines")
  setMachines(@Param("memberId") memberId: string, @Body() body: unknown) {
    return this.pdi.setMachines(memberId, body);
  }

  @Post("attachments")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  add(@Param("memberId") memberId: string, @UploadedFile() file: Express.Multer.File | undefined) {
    return this.pdi.addAttachment(memberId, file);
  }

  @Get("attachments/:attachmentId")
  async download(@Param("memberId") memberId: string, @Param("attachmentId") attachmentId: string) {
    const file = await this.pdi.openAttachment(memberId, attachmentId);
    return new StreamableFile(createReadStream(file.path), {
      type: file.mimeType,
      disposition: `attachment; filename="${encodeURIComponent(file.fileName)}"`,
    });
  }

  @Delete("attachments/:attachmentId")
  async remove(@Param("memberId") memberId: string, @Param("attachmentId") attachmentId: string) {
    await this.pdi.removeAttachment(memberId, attachmentId);
    return { ok: true };
  }
}
