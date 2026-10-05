import { Injectable } from "@nestjs/common";
import { DEFAULT_QUALIFIED_ADHERENCE, type MatrixSettingsDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

const ROW = "default";

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(): Promise<MatrixSettingsDto> {
    const row = await this.prisma.matrixSetting.findUnique({ where: { id: ROW } });
    return { qualifiedAdherence: row?.qualifiedAdherence ?? DEFAULT_QUALIFIED_ADHERENCE };
  }

  async save(settings: MatrixSettingsDto): Promise<MatrixSettingsDto> {
    const row = await this.prisma.matrixSetting.upsert({
      where: { id: ROW },
      create: { id: ROW, qualifiedAdherence: settings.qualifiedAdherence },
      update: { qualifiedAdherence: settings.qualifiedAdherence },
    });
    return { qualifiedAdherence: row.qualifiedAdherence };
  }
}
