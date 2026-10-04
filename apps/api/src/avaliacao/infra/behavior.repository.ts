import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EMPTY_BEHAVIOR, normalizeBehavior, type Behavior } from "../domain/behavior";

@Injectable()
export class BehaviorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(memberId: string): Promise<Behavior> {
    const row = await this.prisma.memberBehavior.findUnique({ where: { memberId } });
    return row ? normalizeBehavior(row) : EMPTY_BEHAVIOR;
  }

  async save(memberId: string, behavior: Behavior): Promise<void> {
    await this.prisma.memberBehavior.upsert({
      where: { memberId },
      create: { memberId, ...behavior },
      update: behavior,
    });
  }
}
