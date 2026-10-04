import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.session.create({ data: { userId, tokenHash, expiresAt } });
  }

  async findActive(tokenHash: string, now: Date): Promise<{ email: string; expiresAt: Date } | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      select: { expiresAt: true, user: { select: { email: true } } },
    });
    if (!session || session.expiresAt <= now) return null;
    return { email: session.user.email, expiresAt: session.expiresAt };
  }

  deleteExpired(now: Date) {
    return this.prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
  }

  deleteByHash(tokenHash: string) {
    return this.prisma.session.deleteMany({ where: { tokenHash } });
  }
}
