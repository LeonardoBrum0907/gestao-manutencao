import { createReadStream } from "fs";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { parseRecordList, type RecordListQuery } from "../application/parse-record-list";
import { Records } from "../application/records";
import { RecordsList } from "../application/records-list";

@Controller("api/records")
export class RecordsController {
  constructor(
    private readonly records: Records,
    private readonly list: RecordsList,
  ) {}

  @Get()
  page(@Query() query: RecordListQuery) {
    return this.list.page(parseRecordList(query));
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.records.get(id);
  }

  @Post()
  capture(@Body() body: unknown) {
    return this.records.capture(body);
  }

  @Get(":id/removal")
  removal(@Param("id") id: string) {
    return this.records.removalCheck(id);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    await this.records.remove(id);
    return { ok: true };
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.records.updateSheet(id, body);
  }

  @Post(":id/attachments")
  @UseInterceptors(
    FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  add(@Param("id") id: string, @UploadedFile() file: Express.Multer.File | undefined) {
    return this.records.addAttachment(id, file);
  }

  @Get(":id/attachments/:attachmentId")
  async download(@Param("id") id: string, @Param("attachmentId") attachmentId: string) {
    const file = await this.records.openAttachment(id, attachmentId);
    return new StreamableFile(createReadStream(file.path), {
      type: file.mimeType,
      disposition: `attachment; filename="${encodeURIComponent(file.fileName)}"`,
    });
  }

  @Delete(":id/attachments/:attachmentId")
  async remove(@Param("id") id: string, @Param("attachmentId") attachmentId: string) {
    await this.records.removeAttachment(id, attachmentId);
    return { ok: true };
  }
}
