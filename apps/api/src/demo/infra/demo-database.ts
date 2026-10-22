import type { PrismaService } from "../../prisma/prisma.service";
import type { DemoDatabase } from "../application/demo-services";
import type { DemoDatabaseCounts } from "../domain/demo-guard";

/**
 * O que a carga faz direto no Prisma: só no banco da demonstração, depois de assertDemoSeedAllowed.
 * @example const database = new PrismaDemoDatabase(app.get(PrismaService))
 */
export class PrismaDemoDatabase implements DemoDatabase {
  constructor(private readonly prisma: PrismaService) {}

  async counts(): Promise<DemoDatabaseCounts> {
    const [factories, members, records, rps] = await Promise.all([
      this.prisma.factory.count(),
      this.prisma.member.count(),
      this.prisma.record.count(),
      this.prisma.rp.count(),
    ]);
    return { factories, members, records, rps };
  }

  // Banco novo: nada aponta ainda para o catálogo do SIGEM que as migrações gravaram.
  async removeStarterCatalog(): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.matrixSkill.deleteMany(),
      this.prisma.subassembly.deleteMany(),
      this.prisma.matrixEquipment.deleteMany(),
    ]);
  }

  // Registros, RPs e fichas "nascem" quando aconteceram; o cadastro, antes de tudo.
  async backdate(createdAt: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.$executeRaw`UPDATE "Record" SET "createdAt" = "occurredAt", "updatedAt" = COALESCE("completedAt", "closedAt", "occurredAt")`,
      this.prisma.$executeRaw`UPDATE "Rp" SET "createdAt" = "occurredAt", "updatedAt" = "occurredAt"`,
      this.prisma.$executeRaw`UPDATE "PostPreventive" SET "createdAt" = COALESCE("occurrenceDate", "preventiveDate"), "updatedAt" = COALESCE("occurrenceDate", "preventiveDate")`,
      this.prisma.$executeRaw`UPDATE "Factory" SET "createdAt" = ${createdAt}, "updatedAt" = ${createdAt}`,
      this.prisma.$executeRaw`UPDATE "Line" SET "createdAt" = ${createdAt}, "updatedAt" = ${createdAt}`,
      this.prisma.$executeRaw`UPDATE "Machine" SET "createdAt" = ${createdAt}, "updatedAt" = ${createdAt}`,
      this.prisma.$executeRaw`UPDATE "Member" SET "createdAt" = ${createdAt}, "updatedAt" = ${createdAt}`,
      this.prisma.$executeRaw`UPDATE "Team" SET "createdAt" = ${createdAt}, "updatedAt" = ${createdAt}`,
    ]);
  }

  async setCompletedAt(recordId: string, completedAt: Date): Promise<void> {
    await this.prisma.record.update({ where: { id: recordId }, data: { completedAt } });
  }
}
