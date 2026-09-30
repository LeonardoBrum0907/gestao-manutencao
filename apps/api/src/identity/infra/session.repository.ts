import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.session.create({ data: { userId, tokenHash, expiresAt } });
  }

  async findActiveEmail(tokenHash: string, now: Date): Promise<string | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!session || session.expiresAt <= now) return null;
    return session.user.email;
  }

  deleteByHash(tokenHash: string) {
    return this.prisma.session.deleteMany({ where: { tokenHash } });
  }
}
