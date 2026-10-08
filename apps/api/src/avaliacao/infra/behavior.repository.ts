import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EMPTY_BEHAVIOR, storedBehavior, type Behavior } from "../domain/behavior";

@Injectable()
export class BehaviorRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Como está no banco; quem lê põe as etiquetas na ordem do cadastro.
  async load(memberId: string): Promise<Behavior> {
    const row = await this.prisma.memberBehavior.findUnique({ where: { memberId } });
    return row ? storedBehavior(row) : EMPTY_BEHAVIOR;
  }

  async save(memberId: string, behavior: Behavior): Promise<void> {
    await this.prisma.memberBehavior.upsert({
      where: { memberId },
      create: { memberId, ...behavior },
      update: behavior,
    });
  }
}
